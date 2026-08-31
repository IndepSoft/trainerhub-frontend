import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Trainings = lazy(() => import('@/domains/trainings/pages/Trainings'))
const RoutineCreate = lazy(() => import('@/domains/trainings/pages/RoutineCreate'))
const RoutineDetail = lazy(() => import('@/domains/trainings/pages/RoutineDetail'))

export const trainingsRoutes: RouteObject[] = [
  {
    path: '/trainings',
    element: withSuspense(withProtectedRoute(<Trainings />)),
  },
  /*
   * `/trainings/new` convive con `/trainings/:routineId` sin ambigüedad: react-
   * router puntúa las rutas y un segmento literal siempre gana al dinámico, sea
   * cual sea el orden del array. No depende de escribirla antes, aunque se
   * escribe antes para que quien lea el fichero lo vea.
   */
  {
    path: '/trainings/new',
    element: withSuspense(withProtectedRoute(<RoutineCreate />)),
  },
  {
    path: '/trainings/:routineId',
    element: withSuspense(withProtectedRoute(<RoutineDetail />)),
  },
]
