import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Progreso = lazy(() => import('../pages/Progreso'))

export const progresoRoutes: RouteObject[] = [
  {
    path: '/progreso',
    element: withSuspense(withProtectedRoute(<Progreso />)),
  },
]
