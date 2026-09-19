import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Notices = lazy(() => import('../pages/Notices'))

/**
 * La bandeja de avisos.
 *
 * Sin entrada en la navegación a propósito: se llega por la campana, que es
 * donde se ve que hay algo. Una entrada más en la barra de cinco destinos
 * competiría con lo que se usa a diario.
 */
export const noticesRoutes: RouteObject[] = [
  {
    path: '/notices',
    element: withSuspense(withProtectedRoute(<Notices />)),
  },
]
