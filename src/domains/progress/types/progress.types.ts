import type { LucideIcon } from 'lucide-react'

/**
 * Entidades del resumen de progreso.
 *
 * `ProgressStat` ya no lleva `color`. Antes guardaba una cadena de clases de
 * Tailwind -`'text-orange-600'`- dentro del dato, lo que ponia la presentacion
 * en el dominio: con un backend real, el repositorio tendria que devolver
 * nombres de clases CSS desde Postgres. Ademas era la razon mecanica de que el
 * tema no llegase a estos bloques. El color de los iconos lo decide ahora el
 * componente, y es uniforme.
 *
 * Se eliminan `RecentAchievement`, `ProgressAlert` y `ProgressMetric`: vivian
 * solo para el panel de resumen, que desaparece porque el sendero de hitos y la
 * cabecera de gamificacion ya cumplen esa funcion.
 */

export interface ProgressStat {
  id: string
  icon: LucideIcon
  label: string
  value: number | string
}

export interface ProgressOverview {
  stats: ProgressStat[]
}
