import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withRouteAccess } from '@/shared/infrastructure/routing/withRouteAccess'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Dashboard = lazy(() => import('../pages/Dashboard'))

export const dashboardRoutes: RouteObject[] = [
  {
    path: '/dashboard',
    element: withSuspense(withProtectedRoute(withRouteAccess(<Dashboard />, { minRole: 'trainer' }, 'access.staffOnly'))),
  },
]