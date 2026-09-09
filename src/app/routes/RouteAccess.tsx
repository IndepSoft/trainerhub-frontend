import type { ReactNode } from 'react'
import { useViewerContext } from '@/app/ViewerContext'
import { viewerMayVisit, type AccessRule } from '@/app/config/navigation.config'
import { NotAllowedHere } from '@/shared/components/NotAllowedHere'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

interface RouteAccessProps {
  rule: AccessRule
  /** Qué hace falta para estar aquí, para decírselo a quien no lo tiene. */
  descriptionKey: TranslationKey
  children: ReactNode
}

/**
 * Cierra una ruta con la misma regla con la que la barra la ofrece.
 *
 * NO ES LA SEGURIDAD: la seguridad es RLS, y un alumno que llegaba a
 * `/students` no leía ninguna ficha. Lo que veía era peor que una negativa:
 * una pantalla de gestión vacía con sus controles, y cada uno fallando al
 * tocarlo. Aquí se le dice que esto no es para él y por dónde volver.
 *
 * Espera a que el papel esté resuelto. Decidir con `role === null` mientras
 * carga cerraría la puerta a todo el mundo durante un instante y la pantalla
 * parpadearía con el aviso.
 */
export function RouteAccess({
  rule,
  descriptionKey,
  children,
}: RouteAccessProps) {
  const { t } = useTranslation()
  const { role, hasOwnProgress, active, isPlatformAdmin, loading } =
    useViewerContext()

  if (loading) return null

  const allowed = viewerMayVisit(rule, {
    role,
    hasOwnProgress,
    extraCapabilities: active?.extraCapabilities ?? [],
    isPlatformAdmin,
  })

  if (!allowed) return <NotAllowedHere description={t(descriptionKey)} />

  return <>{children}</>
}
