import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import { LoadingFallback } from '@/shared/components/LoadingFallback'
import type { IntendedLocationState } from '../libs/intendedPath'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Deja pasar a quien ha iniciado sesión, y RECUERDA A DÓNDE IBA.
 *
 * Sin lo segundo, el flujo del QR se rompía en su caso más frecuente: alguien
 * sin cuenta escanea el código de su entrenador, aterriza aquí, se identifica y
 * acaba en su progreso con el código perdido. Ahora vuelve a donde iba.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const location = useLocation()

  if (loading) {
    return <LoadingFallback />
  }

  if (user) return <>{children}</>

  // La ruta va como texto -camino y parametros- porque el estado del historial
  // se serializa y de aqui solo hace falta a donde iba.
  const state: IntendedLocationState = { from: location.pathname + location.search }
  return <Navigate to="/authentication" replace state={state} />
}
