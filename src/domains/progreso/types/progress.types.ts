import type { LucideIcon } from 'lucide-react'

/**
 * Entidades del resumen de progreso.
 *
 * No existian: los datos vivian escritos en el JSX de la pagina, asi que no
 * habia ningun tipo que los describiera.
 */

export interface ProgressStat {
  id: string
  icon: LucideIcon
  color: string
  label: string
  value: number | string
}

export interface RecentAchievement {
  id: string
  icon: LucideIcon
  bgColor: string
  iconColor: string
  name: string
  description: string
  time: string
}

export interface ProgressAlert {
  id: string
  icon: LucideIcon
  bgColor: string
  iconColor: string
  title: string
  description: string
}

export interface ProgressMetric {
  id: string
  value: number | string
  label: string
  color: string
}

export interface ProgressOverview {
  stats: ProgressStat[]
  recentAchievements: RecentAchievement[]
  alerts: ProgressAlert[]
  metrics: ProgressMetric[]
}
