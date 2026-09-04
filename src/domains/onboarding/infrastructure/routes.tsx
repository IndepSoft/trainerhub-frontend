import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Onboarding = lazy(() => import('../pages/Onboarding'))

export const onboardingRoutes: RouteObject[] = [
  {
    path: '/onboarding',
    element: withSuspense(withProtectedRoute(<Onboarding />)),
  },
]
