import { withProtectedRoute } from '@/shared/infrastructure/routing/withProtectedRoute'
import { withSuspense } from '@/shared/infrastructure/routing/withSuspense'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Settings = lazy(() => import('../pages/Settings'))

/**
 * La ruta de configuracion.
 *
 * `navigation.config` la declaraba desde el principio y no existia: la barra
 * lateral llevaba a una pantalla en blanco. Era la deuda mas visible del
 * proyecto, porque cualquiera que pulsara «Configuracion» la encontraba.
 */
export const settingsRoutes: RouteObject[] = [
  {
    path: '/settings',
    element: withSuspense(withProtectedRoute(<Settings />)),
  },
]
