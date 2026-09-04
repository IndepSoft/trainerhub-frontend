import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Progress = lazy(() => import('../pages/Progress'))
const Celebration = lazy(() => import('../pages/Celebration'))

export const progressRoutes: RouteObject[] = [
  {
    path: '/progress',
    element: withSuspense(withProtectedRoute(<Progress />)),
  },
  {
    path: '/progress/celebracion',
    element: withSuspense(withProtectedRoute(<Celebration />)),
  },
]
