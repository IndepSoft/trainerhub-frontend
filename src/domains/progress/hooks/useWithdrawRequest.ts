import { useCallback, useState } from 'react'
import { container } from '@/app/container'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

interface UseWithdrawRequestResult {
  withdraw: (studentId: string) => Promise<void>
  withdrawing: boolean
  error: string | null
}

/**
 * Retirar la solicitud de entrada a un equipo.
 *
 * Quien esperaba aprobación no tenía ninguna salida: ni retirarse si se
 * equivocó de código ni pedir entrar a otro sitio. `useViewer` escucha las
 * fichas, así que al borrarla la pantalla vuelve sola a la invitación.
 */
export function useWithdrawRequest(): UseWithdrawRequestResult {
  const { t } = useTranslation()
  const [withdrawing, setWithdrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const withdraw = useCallback(
    async (studentId: string) => {
      setWithdrawing(true)
      setError(null)
      try {
        await container.students.withdrawRequest(studentId)
      } catch (caught) {
        setError(describeError(caught, t, 'joinCrew.withdrawError'))
      } finally {
        setWithdrawing(false)
      }
    },
    [t]
  )

  return { withdraw, withdrawing, error }
}
