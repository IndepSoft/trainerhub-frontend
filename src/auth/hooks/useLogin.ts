import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import { container } from '@/app/container'
import { AppError } from '@/shared/domain/errors'
import type { LoginCredentials } from '@/shared/domain/entities/auth'

const messageFor = (err: unknown) =>
  AppError.is(err) ? err.message : 'Error al iniciar sesión'

export const useLogin = () => {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loginWithEmail = async (credentials: LoginCredentials) => {
    setError(null)
    setLoading(true)

    try {
      const user = await container.auth.signInWithEmail(credentials)
      setUser(user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setError(null)
    setLoading(true)

    try {
      await container.auth.signInWithGoogle()
      // La navegacion la resuelve el redirect de OAuth al volver.
    } catch (err) {
      setError(messageFor(err))
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return { loginWithEmail, loginWithGoogle, error, loading, clearError }
}
