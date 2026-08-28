import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const LiveSession = lazy(() => import('../pages/LiveSession'))

export const sessionRoutes: RouteObject[] = [
  {
    path: '/session',
    element: withSuspense(withProtectedRoute(<LiveSession />)),
  },
]
