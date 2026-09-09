import type { JSX } from 'react'
import { RouteAccess } from '@/app/routes/RouteAccess'
import type { AccessRule } from '@/app/config/navigation.config'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

/** Envuelve una ruta protegida con la regla de acceso que la barra ya aplica. */
export function withRouteAccess(
  element: JSX.Element,
  rule: AccessRule,
  descriptionKey: TranslationKey
): JSX.Element {
  return (
    <RouteAccess rule={rule} descriptionKey={descriptionKey}>
      {element}
    </RouteAccess>
  )
}
