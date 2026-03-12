import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import { authService } from '../infrastructure/authService'
import type { LoginCredentials } from '../infrastructure/authService'

export const useLogin = () => {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loginWithEmail = async (credentials: LoginCredentials) => {
    setError(null)
    setLoading(true)

    try {
      const user = await authService.loginWithEmail(credentials)
      setUser(user) // Actualiza el store
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setError(null)
    setLoading(true)

    try {
      await authService.loginWithGoogle()
      // La navegación la maneja el redirect de OAuth
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return {
    loginWithEmail,
    loginWithGoogle,
    error,
    loading,
    clearError,
  }
}