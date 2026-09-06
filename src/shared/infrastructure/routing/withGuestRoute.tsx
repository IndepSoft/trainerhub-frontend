import { GuestRoute } from '@/auth/components/GuestRoute'
import type { JSX } from 'react'

/** Gemelo de `withProtectedRoute` para las rutas que exigen NO tener sesión. */
export function withGuestRoute(element: JSX.Element) {
  return <GuestRoute>{element}</GuestRoute>
}
