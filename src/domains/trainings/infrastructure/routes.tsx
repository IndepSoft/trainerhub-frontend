import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Trainings = lazy(() => import('@/domains/trainings/pages/Trainings'))
const RoutineForm = lazy(() => import('@/domains/trainings/pages/RoutineForm'))
const PlanForm = lazy(() => import('@/domains/trainings/pages/PlanForm'))
const TrainingCatalog = lazy(() => import('@/domains/trainings/pages/TrainingCatalog'))
const RoutineDetail = lazy(() => import('@/domains/trainings/pages/RoutineDetail'))

export const trainingsRoutes: RouteObject[] = [
  {
    path: '/trainings',
    element: withSuspense(withProtectedRoute(<Trainings />)),
  },
  /*
   * `/trainings/new` y `/trainings/catalog` conviven con `/trainings/:routineId`
   * sin ambigüedad: react-router puntúa las rutas y un segmento literal siempre
   * gana al dinámico, sea cual sea el orden del array. No depende de escribirlas
   * antes, aunque se escriben antes para que quien lea el fichero lo vea.
   */
  {
    path: '/trainings/new',
    element: withSuspense(withProtectedRoute(<RoutineForm />)),
  },
  {
    path: '/trainings/catalog',
    element: withSuspense(withProtectedRoute(<TrainingCatalog />)),
  },
  /*
   * Los planes cuelgan de `/trainings/plans/...`, con tres segmentos, asi que
   * no compiten con `/trainings/:routineId`, que solo tiene dos.
   */
  {
    path: '/trainings/plans/new',
    element: withSuspense(withProtectedRoute(<PlanForm />)),
  },
  {
    path: '/trainings/plans/:planId/edit',
    element: withSuspense(withProtectedRoute(<PlanForm />)),
  },
  {
    path: '/trainings/:routineId',
    element: withSuspense(withProtectedRoute(<RoutineDetail />)),
  },
  {
    path: '/trainings/:routineId/edit',
    element: withSuspense(withProtectedRoute(<RoutineForm />)),
  },
]
