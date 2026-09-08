import { useState } from 'react'
import { container } from '@/app/container'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

interface UseResendConfirmationResult {
  loading: boolean
  error: string | null
  /** Ya se reenvió una vez: el botón se apaga para no pedir el tercero. */
  resent: boolean
  resend: (email: string) => Promise<void>
}

/**
 * Volver a mandar el correo de confirmación del alta.
 *
 * SE PERMITE UNA VEZ por pantalla. El proveedor limita los envíos por hora, y
 * el segundo reenvío seguido no arregla un buzón que no recibe: sólo gasta el
 * cupo y acaba en «demasiados intentos» para quien venga detrás.
 */
export function useResendConfirmation(): UseResendConfirmationResult {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  const resend = async (email: string): Promise<void> => {
    setError(null)
    setLoading(true)

    try {
      await container.auth.resendConfirmation(email)
      setResent(true)
    } catch (caught) {
      setError(describeError(caught, t, 'register.confirm.resendError'))
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, resent, resend }
}
