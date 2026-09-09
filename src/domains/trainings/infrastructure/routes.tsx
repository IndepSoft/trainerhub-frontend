import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withRouteAccess } from '@/shared/infrastructure/routing/withRouteAccess'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Trainings = lazy(() => import('@/domains/trainings/pages/Trainings'))
const RoutineForm = lazy(() => import('@/domains/trainings/pages/RoutineForm'))
const PlanForm = lazy(() => import('@/domains/trainings/pages/PlanForm'))
const PlanDetail = lazy(() => import('@/domains/trainings/pages/PlanDetail'))
const TrainingCatalog = lazy(() => import('@/domains/trainings/pages/TrainingCatalog'))
const RoutineDetail = lazy(() => import('@/domains/trainings/pages/RoutineDetail'))

export const trainingsRoutes: RouteObject[] = [
  {
    path: '/trainings',
    element: withSuspense(withProtectedRoute(withRouteAccess(<Trainings />, { capability: 'training.manage' }, 'access.trainingManage'))),
  },
  /*
   * `/trainings/new` y `/trainings/catalog` conviven con `/trainings/:routineId`
   * sin ambigüedad: react-router puntúa las rutas y un segmento literal siempre
   * gana al dinámico, sea cual sea el orden del array. No depende de escribirlas
   * antes, aunque se escriben antes para que quien lea el fichero lo vea.
   */
  {
    path: '/trainings/new',
    element: withSuspense(withProtectedRoute(withRouteAccess(<RoutineForm />, { capability: 'training.manage' }, 'access.trainingManage'))),
  },
  {
    path: '/trainings/catalog',
    element: withSuspense(withProtectedRoute(withRouteAccess(<TrainingCatalog />, { capability: 'training.manage' }, 'access.trainingManage'))),
  },
  /*
   * Los planes cuelgan de `/trainings/plans/...`, con tres segmentos, asi que
   * no compiten con `/trainings/:routineId`, que solo tiene dos.
   */
  {
    path: '/trainings/plans/new',
    element: withSuspense(withProtectedRoute(withRouteAccess(<PlanForm />, { capability: 'training.manage' }, 'access.trainingManage'))),
  },
  {
    path: '/trainings/plans/:planId',
    element: withSuspense(withProtectedRoute(withRouteAccess(<PlanDetail />, { capability: 'training.manage' }, 'access.trainingManage'))),
  },
  {
    path: '/trainings/plans/:planId/edit',
    element: withSuspense(withProtectedRoute(withRouteAccess(<PlanForm />, { capability: 'training.manage' }, 'access.trainingManage'))),
  },
  {
    path: '/trainings/:routineId',
    element: withSuspense(withProtectedRoute(withRouteAccess(<RoutineDetail />, { capability: 'training.manage' }, 'access.trainingManage'))),
  },
  {
    path: '/trainings/:routineId/edit',
    element: withSuspense(withProtectedRoute(withRouteAccess(<RoutineForm />, { capability: 'training.manage' }, 'access.trainingManage'))),
  },
]
