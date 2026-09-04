import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const CrewPage = lazy(() => import('../pages/CrewPage'))
const NewCrew = lazy(() => import('../pages/NewCrew'))
const JoinCrew = lazy(() => import('../pages/JoinCrew'))
const CrewSettings = lazy(() => import('../pages/CrewSettings'))
const CrewStaffPage = lazy(() => import('../pages/CrewStaffPage'))

/**
 * Las rutas del equipo.
 *
 * `/crew/unirse` es la que abre el QR, así que su forma es parte del contrato:
 * un código impreso en un cartel apunta a esta URL para siempre. Cambiarla
 * dejaría muertos todos los QR que ya estén en circulación.
 */
export const crewRoutes: RouteObject[] = [
  {
    path: '/crew',
    element: withSuspense(withProtectedRoute(<CrewPage />)),
  },
  {
    path: '/crew/nuevo',
    element: withSuspense(withProtectedRoute(<NewCrew />)),
  },
  {
    path: '/crew/unirse',
    element: withSuspense(withProtectedRoute(<JoinCrew />)),
  },
  {
    path: '/crew/ajustes',
    element: withSuspense(withProtectedRoute(<CrewSettings />)),
  },
  {
    path: '/crew/equipo',
    element: withSuspense(withProtectedRoute(<CrewStaffPage />)),
  },
]
