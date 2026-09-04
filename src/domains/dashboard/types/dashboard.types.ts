import type { LucideIcon } from 'lucide-react'
import type { Session } from '@/shared/domain/entities/session'

/**
 * Entidades del dashboard.
 *
 * Antes vivían dentro de los propios componentes (`ISessionItem` en
 * `SessionItem`, `IRecentActivityItem` en `ActivityItem`) y cumplían dos
 * papeles a la vez: describir el dato y describir los props del componente que
 * lo pinta. Separarlos permite que la entidad sobreviva a cualquier cambio de
 * presentación, y que un segundo componente reutilice el mismo dato sin
 * arrastrar los props del primero.
 */

/**
 * LA SESIÓN YA NO SE DECLARA AQUÍ.
 *
 * Había una `Session` propia —`customer`, `activity`, y un estado
 * `programmed | confirmed | canceled` que ni siquiera coincidía con el de la
 * agenda—. Era una tercera forma del mismo concepto, alimentada por datos
 * inventados: el panel enseñaba sesiones que no existían en ninguna agenda.
 * Ahora usa la de `shared/domain` y las lee del puerto.
 */

/** Una sesión próxima con el nombre de su alumno ya resuelto. */
export interface UpcomingSession {
  session: Session
  studentName: string
}

export type ActivityColor = 'green' | 'primary' | 'secondary'

export interface RecentActivityEntry {
  id: string
  event: string
  timeAgo: string
  color: ActivityColor
}

export type IndicatorPeriod = 'week' | 'month' | 'year'

export type IndicatorTrend = 'up' | 'down' | 'same'

export interface DashboardIndicator {
  id: string
  title: string
  indicator: number
  icon: LucideIcon
  /**
   * La tendencia es OPCIONAL, y hoy no se calcula ninguna.
   *
   * Comparar con el periodo anterior exige historico, y no lo hay: los deltas
   * que se pintaban —«+5 este mes»— eran inventados. `MetricBlock` ya omite la
   * línea cuando faltan, en vez de pintar un cero engañoso, así que la cifra se
   * queda sola hasta que haya con qué compararla.
   */
  period?: IndicatorPeriod
  delta?: number
  deltaType?: IndicatorTrend
  prefix?: string
}

/** Todo lo que el dashboard necesita para pintarse. */
export interface DashboardSummary {
  indicators: DashboardIndicator[]
  upcomingSessions: UpcomingSession[]
  recentActivity: RecentActivityEntry[]
}
