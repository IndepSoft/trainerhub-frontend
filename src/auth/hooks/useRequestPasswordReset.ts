import { useState } from 'react'
import { container } from '@/app/container'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

interface UseRequestPasswordResetResult {
  loading: boolean
  error: string | null
  /** El correo al que se mandó el enlace, o `null` mientras no se ha mandado. */
  sentTo: string | null
  request: (email: string) => Promise<void>
}

/**
 * Pedir el enlace para restablecer la contraseña.
 *
 * `sentTo` y no un booleano: la pantalla que sigue enseña la dirección, por lo
 * mismo que «revisa tu correo» del alta: el error corriente es haberla
 * tecleado mal, y es la única forma de verlo.
 */
export function useRequestPasswordReset(): UseRequestPasswordResetResult {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const request = async (email: string): Promise<void> => {
    const address = email.trim()
    setError(null)
    setLoading(true)

    try {
      await container.auth.requestPasswordReset(address)
      setSentTo(address)
    } catch (caught) {
      setError(describeError(caught, t, 'auth.reset.error'))
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, sentTo, request }
}
