import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { LoadingFallback } from '@/shared/components/LoadingFallback'
import { dashboardRoutes } from '@/domains/dashboard/infrastructure/routes'
import { trainingsRoutes } from '@/domains/trainings/infrastructure/routes'
import { studentsRoutes } from '@/domains/students/infrastructure/routes'
import { authRoutes } from '@/auth/infrastructure/routes'
import { gamificationRoutes } from '@/domains/gamification/infrastructure/routes'
import { calendarRoutes } from '@/domains/calendar/infrastructure/routes'

const RootLayout = lazy(() => import('@/app/layouts/RootLayout'))
const NotFound = lazy(() => import('@/shared/pages/NotFound'))

const domainRoutes = [
  ...dashboardRoutes,
  ...trainingsRoutes,
  ...studentsRoutes,
  ...gamificationRoutes,
  ...calendarRoutes,
  ...authRoutes,
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RootLayout />
      </Suspense>
    ),
    errorElement: (
      <Suspense fallback={<LoadingFallback />}>
        <NotFound />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      ...domainRoutes,
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
