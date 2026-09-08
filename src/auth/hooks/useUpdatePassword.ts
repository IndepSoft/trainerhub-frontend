import { useState } from 'react'
import { container } from '@/app/container'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

/** El suelo que exige el proveedor. Aquí se comprueba antes, para no ir a preguntar. */
export const MINIMUM_PASSWORD_LENGTH = 6

interface UseUpdatePasswordResult {
  loading: boolean
  error: string | null
  /** Devuelve `true` si la contraseña quedó cambiada. */
  update: (newPassword: string, confirmation: string) => Promise<boolean>
}

/**
 * Cambiar la contraseña de la sesión vigente.
 *
 * UN HOOK PARA DOS PUERTAS: la vuelta del correo de recuperación y
 * Configuración. Las dos validan lo mismo —longitud y que las dos copias
 * coincidan— y llaman a la misma operación del puerto; lo que cambia es a dónde
 * van después, y eso lo decide cada pantalla.
 */
export function useUpdatePassword(): UseUpdatePasswordResult {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (newPassword: string, confirmation: string): Promise<boolean> => {
    setError(null)

    if (newPassword.length < MINIMUM_PASSWORD_LENGTH) {
      setError(t('error.passwordTooShort', { min: MINIMUM_PASSWORD_LENGTH }))
      return false
    }
    if (newPassword !== confirmation) {
      setError(t('auth.newPassword.mismatch'))
      return false
    }

    setLoading(true)
    try {
      await container.auth.updatePassword(newPassword)
      return true
    } catch (caught) {
      setError(describeError(caught, t, 'auth.newPassword.error'))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, update }
}
