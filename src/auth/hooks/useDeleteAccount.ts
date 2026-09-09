import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { container } from '@/app/container'
import { useAuthStore } from '@/app/stores/authStore'
import { setActiveCrew } from '@/app/crewScope'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

interface UseDeleteAccountResult {
  loading: boolean
  error: string | null
  deleteAccount: () => Promise<void>
}

/**
 * Darse de baja.
 *
 * Al terminar se hace lo mismo que al cerrar sesión —soltar el ámbito, vaciar
 * el usuario— y se va a la pantalla de acceso. El puerto puede negarse con
 * `lastAdmin`: quien gobierna solo un equipo con más gente tiene que nombrar a
 * otro antes, y eso se le dice aquí, en el sitio.
 */
export function useDeleteAccount(): UseDeleteAccountResult {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteAccount = async (): Promise<void> => {
    setError(null)
    setLoading(true)

    try {
      await container.auth.deleteAccount()
      setActiveCrew(null)
      setUser(null)
      navigate('/authentication', { replace: true })
    } catch (caught) {
      setError(describeError(caught, t, 'settings.deleteAccount.error'))
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, deleteAccount }
}
