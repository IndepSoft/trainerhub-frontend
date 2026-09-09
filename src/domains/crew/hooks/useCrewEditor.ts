import { useCallback, useState } from 'react'
import { container } from '@/app/container'
import { setActiveCrew } from '@/app/crewScope'
import type { Crew, CrewDenomination } from '@/shared/domain/entities/crew'
import type { CrewSettings } from '@/shared/domain/ports/CrewRepository'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

interface CreateCrewInput {
  name: string
  denomination: CrewDenomination
  ownerId: string
  /** Cómo aparecerá en la lista del equipo técnico. */
  ownerName: string
  ownerEmail: string
}

interface UseCrewEditorResult {
  createCrew: (input: CreateCrewInput) => Promise<Crew | null>
  updateCrew: (crewId: string, settings: CrewSettings) => Promise<void>
  rotateJoinToken: (crewId: string) => Promise<string | null>
  requestActivation: (crewId: string) => Promise<void>
  saving: boolean
  error: string | null
}

/**
 * Crear un crew y cambiar sus ajustes.
 *
 * `rotateJoinToken` es la operación que hace útil al QR: cuando se filtra —una
 * foto en una story, un cartel que se queda colgado— el entrenador genera uno
 * nuevo y el anterior deja de servir en el acto. Sin rotación, un QR impreso es
 * una puerta abierta para siempre.
 */
export function useCrewEditor(): UseCrewEditorResult {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async <T,>(operation: () => Promise<T>): Promise<T | null> => {
    setSaving(true)
    setError(null)

    try {
      return await operation()
    } catch (caught) {
      setError(describeError(caught, t, 'crew.saveError'))
      return null
    } finally {
      setSaving(false)
    }
  }, [t])

  const createCrew = useCallback(
    (input: CreateCrewInput) =>
      run(async () => {
        /*
         * QUIEN CREA UN CREW NACE ADMINISTRADOR, y lo escribe el puerto en el
         * mismo acto: con Supabase, `create_crew` en una transaccion; en la
         * simulacion, el adaptador sienta al fundador al nacer. Aqui habia una
         * segunda escritura -el puesto- que con la funcion del servidor
         * duplicaba el alta y fallaba, y sin ella podia dejar un equipo sin
         * nadie que pudiera entrar.
         *
         * `setActiveCrew` despues: el ambito se mueve al equipo recien nacido.
         * Es el unico sitio donde se mueve a mano.
         */
        const crew = await container.crews.create({
          name: input.name,
          denomination: input.denomination,
          ownerId: input.ownerId,
          ownerName: input.ownerName,
          ownerEmail: input.ownerEmail,
        })
        setActiveCrew(crew.id)

        return crew
      }),
    [run]
  )

  const updateCrew = useCallback(
    async (crewId: string, settings: CrewSettings) => {
      await run(() => container.crews.update(crewId, settings))
    },
    [run]
  )

  const rotateJoinToken = useCallback(
    (crewId: string) => run(() => container.crews.rotateJoinToken(crewId)),
    [run]
  )

  const requestActivation = useCallback(
    async (crewId: string) => {
      await run(() => container.crews.requestActivation(crewId))
    },
    [run]
  )

  return { createCrew, updateCrew, rotateJoinToken, requestActivation, saving, error }
}
