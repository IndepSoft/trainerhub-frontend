import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { LoadingFallback } from '@/shared/components/LoadingFallback'
import { dashboardRoutes } from '@/domains/dashboard/infrastructure/routes'
import { trainingsRoutes } from '@/domains/trainings/infrastructure/routes'
import { studentsRoutes } from '@/domains/students/infrastructure/routes'
import { authRoutes } from '@/auth/infrastructure/routes'
import { progressRoutes } from '@/domains/progress/infrastructure/routes'
import { calendarRoutes } from '@/domains/calendar/infrastructure/routes'
import { reportsRoutes } from '@/domains/reports/infrastructure/routes'
import { sessionRoutes } from '@/domains/session/infrastructure/routes'
import { onboardingRoutes } from '@/domains/onboarding/infrastructure/routes'
import { crewRoutes } from '@/domains/crew/infrastructure/routes'
import { platformRoutes } from '@/domains/platform/infrastructure/routes'
import { settingsRoutes } from '@/domains/settings/infrastructure/routes'

const RootLayout = lazy(() => import('@/app/layouts/RootLayout'))
const NotFound = lazy(() => import('@/shared/pages/NotFound'))
const HomeRedirect = lazy(() => import('@/app/routes/HomeRedirect'))

const domainRoutes = [
  ...dashboardRoutes,
  ...trainingsRoutes,
  ...studentsRoutes,
  ...progressRoutes,
  ...calendarRoutes,
  ...reportsRoutes,
  ...sessionRoutes,
  ...onboardingRoutes,
  ...crewRoutes,
  ...platformRoutes,
  ...settingsRoutes,
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
        /*
         * La raiz depende del papel: el entrenador va al panel y el alumno a su
         * progreso. Era un `Navigate` fijo a `/dashboard`, que es la pantalla de
         * gestion, asi que un alumno aterrizaba en la aplicacion de otro.
         */
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <HomeRedirect />
          </Suspense>
        ),
      },
      ...domainRoutes,
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
