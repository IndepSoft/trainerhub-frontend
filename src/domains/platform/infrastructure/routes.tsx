import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const PlatformAdmin = lazy(() => import('../pages/PlatformAdmin'))

/**
 * La ruta del panel de plataforma.
 *
 * Protegida como cualquier otra, y ademas la propia pagina comprueba que quien
 * entra la administra. No hay una guarda de ruta por rol aparte porque seria
 * una tercera forma de decir lo mismo: el rol se resuelve una vez, en el layout,
 * y quien lo necesita lo lee del contexto.
 */
export const platformRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: withSuspense(withProtectedRoute(<PlatformAdmin />)),
  },
]
