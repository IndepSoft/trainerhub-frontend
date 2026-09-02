import { useCallback, useState } from 'react'
import { container } from '@/app/container'
import { setActiveCrew } from '@/app/crewScope'
import { AppError } from '@/shared/domain/errors'
import type { Crew, CrewDenomination } from '@/shared/domain/entities/crew'
import type { CrewSettings } from '@/shared/domain/ports/CrewRepository'

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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async <T,>(operation: () => Promise<T>): Promise<T | null> => {
    setSaving(true)
    setError(null)

    try {
      return await operation()
    } catch (caught) {
      setError(AppError.is(caught) ? caught.message : 'No se pudo guardar el equipo')
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const createCrew = useCallback(
    (input: CreateCrewInput) =>
      run(async () => {
        const crew = await container.crews.create({
          name: input.name,
          denomination: input.denomination,
          ownerId: input.ownerId,
        })

        /*
         * QUIEN CREA UN CREW NACE ADMINISTRADOR, y hay que escribirlo: el rol ya
         * no se deduce de haber fundado el equipo, sale del puesto. Sin esta
         * alta, el fundador se quedaría fuera de su propio crew —sin puesto no
         * hay pertenencia— y no podría ni entrar.
         *
         * `setActiveCrew` antes del alta porque el puesto se escribe en el crew
         * ACTIVO, y en este instante el activo sigue siendo el anterior o
         * ninguno. Es el único sitio donde el ámbito se mueve a mano, y es
         * porque el equipo acaba de nacer.
         *
         * TODO: con backend, crear el crew y su primer puesto van en la misma
         * transacción del servidor. Aquí, si lo segundo falla queda un equipo
         * sin nadie que pueda entrar.
         */
        setActiveCrew(crew.id)
        await container.crewStaff.add({
          profileId: input.ownerId,
          role: 'admin',
          extraCapabilities: [],
          displayName: input.ownerName,
          email: input.ownerEmail,
        })

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

  return { createCrew, updateCrew, rotateJoinToken, saving, error }
}
