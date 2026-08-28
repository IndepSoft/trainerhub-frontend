import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Reports = lazy(() => import('../pages/Reports'))

export const reportsRoutes: RouteObject[] = [
  {
    path: '/reports',
    element: withSuspense(withProtectedRoute(<Reports />)),
  },
]
