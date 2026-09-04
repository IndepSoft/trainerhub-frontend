import { useCallback, useState } from 'react'
import { container } from '@/app/container'
import { useAuthStore } from '@/app/stores/authStore'
import { AppError } from '@/shared/domain/errors'
import { canEnrollMembers } from '@/shared/domain/entities/crew'
import type { Crew } from '@/shared/domain/entities/crew'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/** Cómo acabó el intento, para que la pantalla sepa qué decir. */
export type JoinOutcome =
  | { kind: 'joined'; crew: Crew }
  | { kind: 'pending'; crew: Crew }
  | { kind: 'already'; crew: Crew }

interface UseJoinCrewResult {
  join: (code: string) => Promise<JoinOutcome | null>
  joining: boolean
  error: string | null
  clearError: () => void
}

/**
 * Unirse a un crew con el código del QR.
 *
 * ES LA MISMA OPERACIÓN QUE EL ENLACE POR CORREO, con otro envoltorio. Por eso
 * el trabajo de verdad está en `students.claimMembership`, que busca la ficha
 * antes de crearla: si el entrenador ya la había hecho con este correo, se
 * reclama esa —con su historial y sus sesiones— en vez de abrir otra.
 *
 * VOLVER A ESCANEAR EL PROPIO QR NO ES UN ERROR. Es lo más normal del mundo
 * —está en la pared del gimnasio— y tiene que decir «ya estás dentro», no
 * fallar ni crear nada.
 *
 * Y un código que no existe se rechaza SIN MÁS DETALLE. Distinguir «nunca
 * existió» de «existió y se rotó» le confirmaría a quien prueba códigos que
 * acertó alguna vez.
 */
export function useJoinCrew(): UseJoinCrewResult {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const join = useCallback(
    async (code: string): Promise<JoinOutcome | null> => {
      if (user === null) {
        setError(t('join.needAccount'))
        return null
      }

      setJoining(true)
      setError(null)

      try {
        const crew = await container.crews.findByJoinToken(code)
        if (crew === null) {
          setError(t('join.badCode'))
          return null
        }

        /*
         * Se comprueba TAMBIÉN aquí, no sólo al pintar el QR.
         *
         * El código puede seguir circulando después de que la suscripción se
         * suspenda —está en un cartel, en una foto, en el historial del móvil de
         * alguien— y esconder el QR no lo invalida. La puerta tiene que estar
         * donde se entra, no sólo donde se enseña la llave.
         *
         * El mensaje NO menciona la suscripción: quien intenta entrar es un
         * alumno, y el estado del pago de su entrenador no es asunto suyo ni
         * algo que pueda resolver.
         */
        if (!canEnrollMembers(crew)) {
          setError(t('join.notAccepting'))
          return null
        }

        const own = await container.students.findAllByProfileId(user.id)
        const already = own.find(
          (student) => student.crewId === crew.id && student.membershipStatus === 'active'
        )
        if (already !== undefined) return { kind: 'already', crew }

        await container.students.claimMembership({
          crewId: crew.id,
          profileId: user.id,
          email: user.email,
          status: crew.requiresApproval ? 'pending' : 'active',
        })

        return crew.requiresApproval ? { kind: 'pending', crew } : { kind: 'joined', crew }
      } catch (caught) {
        setError(AppError.is(caught) ? caught.message : t('join.error'))
        return null
      } finally {
        setJoining(false)
      }
    },
    [user, t]
  )

  const clearError = useCallback(() => setError(null), [])

  return { join, joining, error, clearError }
}
