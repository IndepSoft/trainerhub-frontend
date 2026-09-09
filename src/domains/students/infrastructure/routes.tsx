import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withRouteAccess } from '@/shared/infrastructure/routing/withRouteAccess'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Students = lazy(() => import('../pages/Students'))
const StudentDetail = lazy(() => import('../pages/StudentDetail'))

export const studentsRoutes: RouteObject[] = [
  {
    path: '/students',
    element: withSuspense(withProtectedRoute(withRouteAccess(<Students />, { capability: 'students.manage' }, 'access.studentsManage'))),
  },
  {
    path: '/students/:studentId',
    element: withSuspense(withProtectedRoute(withRouteAccess(<StudentDetail />, { capability: 'students.manage' }, 'access.studentsManage'))),
  },
]