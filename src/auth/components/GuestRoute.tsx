import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import type { ReactNode } from 'react'
import { LoadingFallback } from '@/shared/components/LoadingFallback'

interface GuestRouteProps {
  children: ReactNode
}

export const GuestRoute = ({ children }: GuestRouteProps) => {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return <LoadingFallback />
  }

  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />
}
