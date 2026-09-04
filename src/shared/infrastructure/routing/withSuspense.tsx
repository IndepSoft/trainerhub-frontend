import { PageSkeleton } from '@/shared/components/PageSkeleton'
import { Suspense, type JSX } from 'react'

/**
 * Envuelve una ruta perezosa con su estado de carga.
 *
 * El respaldo es un esqueleto y no un indicador giratorio: reserva el sitio del
 * contenido, asi que al llegar no salta la maquetacion. Ver PageSkeleton.
 */
export function withSuspense(element: JSX.Element) {
  return <Suspense fallback={<PageSkeleton />}>{element}</Suspense>
}
