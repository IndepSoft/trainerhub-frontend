import type { LucideIcon } from 'lucide-react'

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

export type SessionStatus = 'programmed' | 'confirmed' | 'canceled'

export interface Session {
  id: string
  customer: string
  scheduledDate: string
  activity: string
  status: SessionStatus
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
  period: IndicatorPeriod
  delta: number
  deltaType: IndicatorTrend
  prefix?: string
}

/** Todo lo que el dashboard necesita para pintarse. */
export interface DashboardSummary {
  indicators: DashboardIndicator[]
  upcomingSessions: Session[]
  recentActivity: RecentActivityEntry[]
}
