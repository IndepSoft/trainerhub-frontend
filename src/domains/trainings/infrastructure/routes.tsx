import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Trainings = lazy(() => import('@/domains/trainings/pages/Trainings'))

export const trainingsRoutes: RouteObject[] = [
  {
    path: '/trainings',
    element: withSuspense(withProtectedRoute(<Trainings />)),
  },
]
