import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Students = lazy(() => import('../pages/Students'))

export const studentsRoutes: RouteObject[] = [
  {
    path: '/students',
    element: withSuspense(withProtectedRoute(<Students />)),
  },
]