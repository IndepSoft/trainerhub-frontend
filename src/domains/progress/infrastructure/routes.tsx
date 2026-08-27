import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Progress = lazy(() => import('../pages/Progress'))

export const progressRoutes: RouteObject[] = [
  {
    path: '/progress',
    element: withSuspense(withProtectedRoute(<Progress />)),
  },
]
