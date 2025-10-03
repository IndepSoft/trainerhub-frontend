import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import { ProtectedRoute } from '@/auth/components/ProtectedRoute'
import { GuestRoute } from '@/auth/components/GuestRoute'
import { navigationConfig } from '@/app/config/navigation.config'

// Lazy imports
const RootLayout = lazy(() => import('@/app/layouts/RootLayout'))
const Authentication = lazy(() => import('@/auth/pages/Authentication'))
const Dashboard = lazy(() => import('@/domains/dashboard/pages/Dashboard'))
const Trainings = lazy(() => import('@/domains/trainings/pages/Trainings'))
const Students = lazy(() => import('@/domains/students/pages/Students'))
const Gamification = lazy(
  () => import('@/domains/gamification/pages/Gamification')
)
const NotFound = lazy(() => import('@/shared/pages/NotFound'))
const Calendar = lazy(() => import('@/domains/calendar/pages/Calendar'))

const routeComponents = {
  '/dashboard': Dashboard,
  '/authentication': Authentication,
  '/trainings': Trainings,
  '/students': Students,
  '/gamification': Gamification,
  '/calendar': Calendar,
  // '/settings': Settings,
} as const

function generateRouteElement(
  href: string,
  requiresAuth?: boolean,
  guestOnly?: boolean
) {
  const Component = routeComponents[href as keyof typeof routeComponents]

  if (!Component) {
    return (
      <div className="p-4">
        <h1>Página en desarrollo</h1>
        <p>La página {href} está en construcción.</p>
      </div>
    )
  }

  const element = (
    <Suspense fallback={<div>Loading...</div>}>
      <Component />
    </Suspense>
  )

  if (requiresAuth) {
    return <ProtectedRoute>{element}</ProtectedRoute>
  }

  if (guestOnly) {
    return <GuestRoute>{element}</GuestRoute>
  }

  return element
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <RootLayout />
      </Suspense>
    ),
    errorElement: (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFound />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },

      ...navigationConfig.map((navItem) => ({
        path: navItem.href.replace('/', ''),
        element: generateRouteElement(
          navItem.href,
          navItem.requiresAuth,
          navItem.guestOnly
        ),
      })),

      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])

export { navigationConfig }
