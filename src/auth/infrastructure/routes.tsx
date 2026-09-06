import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { withGuestRoute } from '@/shared/infrastructure/routing/withGuestRoute'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Authentication = lazy(() => import('@/auth/pages/Authentication'))

export const authRoutes: RouteObject[] = [
  {
    path: '/authentication',
    /*
     * La guardia POR FUERA de la suspensión: así se decide si hay que redirigir
     * antes de descargar la pantalla de acceso, que quien ya tiene sesión no va
     * a ver.
     */
    element: withGuestRoute(withSuspense(<Authentication />)),
  },
]
