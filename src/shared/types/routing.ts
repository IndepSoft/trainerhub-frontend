import type { RouteObject } from 'react-router-dom'

export type DomainRoute = RouteObject & {
  requiresAuth?: boolean
  guestOnly?: boolean
}