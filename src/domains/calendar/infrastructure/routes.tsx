import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Calendar = lazy(() => import('@/domains/calendar/pages/Calendar'))

export const calendarRoutes: RouteObject[] = [
  {
    path: '/calendar',
    element: withSuspense(<Calendar />),
  },
]
