import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import { container } from '@/app/container'
import { AppError } from '@/shared/domain/errors'
import { readIntendedPath } from '../libs/intendedPath'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { LoginCredentials } from '@/shared/domain/entities/auth'

/*
 * El mensaje de reserva llega de fuera porque este modulo no puede traducir:
 * `messageFor` es una funcion suelta, sin hook al que agarrarse. Lo traduce
 * quien la llama, que si esta dentro de un componente.
 */
const messageFor = (err: unknown, fallback: string) =>
  AppError.is(err) ? err.message : fallback

export const useLogin = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useAuthStore((state) => state.setUser)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loginWithEmail = async (credentials: LoginCredentials) => {
    setError(null)
    setLoading(true)

    try {
      const user = await container.auth.signInWithEmail(credentials)
      setUser(user)
      /*
       * A donde se queria ir, y si no a la raiz -que es donde `HomeRedirect`
       * decide segun el papel-. Mandar siempre al panel llevaba a un alumno a
       * la pantalla de gestion del entrenador, vacia y con sus rotulos.
       */
      navigate(readIntendedPath(location.state) ?? '/', { replace: true })
    } catch (err) {
      setError(messageFor(err, t('auth.signInError')))
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
      setError(messageFor(err, t('auth.signInError')))
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return { loginWithEmail, loginWithGoogle, error, loading, clearError }
}
