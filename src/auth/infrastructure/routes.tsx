import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Authentication = lazy(() => import('@/auth/pages/Authentication'))

export const authRoutes: RouteObject[] = [
  {
    path: '/authentication',
    element: withSuspense(<Authentication />),
  },
]
