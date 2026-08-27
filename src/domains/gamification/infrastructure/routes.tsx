import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Gamification = lazy(() => import('@/domains/gamification/pages/Gamification'))

export const gamificationRoutes: RouteObject[] = [
  {
    path: '/gamification',
    element: withSuspense(<Gamification />),
  },
]
