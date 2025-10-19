import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return <div>Cargando...</div>
  }

  return user ? <>{children}</> : <Navigate to="/authentication" replace />
}
