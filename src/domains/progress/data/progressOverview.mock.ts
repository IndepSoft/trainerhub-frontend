import {
  AlertTriangle,
  Calendar,
  Flame,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import type {
  ProgressAlert,
  ProgressMetric,
  ProgressOverview,
  ProgressStat,
  RecentAchievement,
} from '../types/progress.types'

/**
 * Datos simulados del resumen de progreso.
 *
 * Estaban escritos directamente en el JSX de la pagina: cinco StatCard, tres
 * logros recientes, tres notificaciones y cuatro metricas, todos con sus
 * valores a fuego entre el marcado.
 *
 * OJO con los valores anteriores de las StatCard: eran 1, 2, 3, "4%" y 5. No
 * eran datos, era la secuencia 1-2-3-4-5 puesta como relleno. Se sustituyen por
 * cifras plausibles para que la pantalla se pueda evaluar.
 *
 * TODO: sustituir por un `ProgressRepository` -puerto en `shared/domain/ports`,
 * adaptador en `shared/infrastructure`- cuando exista el esquema.
 * `useProgressOverview` es el unico punto que habra que tocar.
 */
const stats: ProgressStat[] = [
  { id: 'achievements', icon: Trophy, color: 'text-yellow-600', label: 'Logros Activos', value: 12 },
  { id: 'challenges', icon: Target, color: 'text-blue-600', label: 'Desafíos Activos', value: 5 },
  { id: 'streaks', icon: Flame, color: 'text-orange-600', label: 'Rachas Activas', value: 3 },
  { id: 'participation', icon: Users, color: 'text-green-600', label: 'Participación', value: '87%' },
  { id: 'points', icon: TrendingUp, color: 'text-purple-600', label: 'Puntos Totales', value: 1840 },
]

const recentAchievements: RecentAchievement[] = [
  {
    id: 'recent-1',
    icon: Trophy,
    bgColor: 'bg-green-50',
    iconColor: 'text-yellow-600',
    name: 'Ana García',
    description: 'Desbloqueó "Hábito Formado"',
    time: 'Hace 2h',
  },
  {
    id: 'recent-2',
    icon: Trophy,
    bgColor: 'bg-blue-50',
    iconColor: 'text-yellow-600',
    name: 'Carlos López',
    description: 'Completó "Perfect Week"',
    time: 'Hace 5h',
  },
  {
    id: 'recent-3',
    icon: Trophy,
    bgColor: 'bg-purple-50',
    iconColor: 'text-yellow-600',
    name: 'María Rodríguez',
    description: 'Alcanzó "Transformer"',
    time: 'Ayer',
  },
]

const alerts: ProgressAlert[] = [
  {
    id: 'alert-1',
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 border border-yellow-200',
    iconColor: 'text-yellow-600',
    title: 'Rachas en Riesgo',
    description: '3 estudiantes necesitan atención',
  },
  {
    id: 'alert-2',
    icon: Calendar,
    bgColor: 'bg-green-50 border border-green-200',
    iconColor: 'text-green-600',
    title: 'Desafíos por Vencer',
    description: '3 desafíos terminan esta semana',
  },
  {
    id: 'alert-3',
    icon: Target,
    bgColor: 'bg-blue-50 border border-blue-200',
    iconColor: 'text-blue-600',
    title: 'Nuevos Hitos',
    description: '5 estudiantes cerca de logros',
  },
]

const metrics: ProgressMetric[] = [
  { id: 'participation-rate', value: '87%', label: 'Tasa de Participación', color: 'text-green-600' },
  { id: 'completed-challenges', value: 24, label: 'Desafíos Completados', color: 'text-blue-600' },
  { id: 'active-streaks', value: 3, label: 'Rachas Activas', color: 'text-orange-600' },
  { id: 'average-points', value: 460, label: 'Puntos Promedio', color: 'text-purple-600' },
]

export const progressOverviewMock: ProgressOverview = {
  stats,
  recentAchievements,
  alerts,
  metrics,
}
