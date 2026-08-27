import {
  BanknoteArrowUp,
  BicepsFlexed,
  CalendarDays,
  Users,
} from 'lucide-react'
import type { DashboardSummary } from '../types/dashboard.types'

/**
 * Datos simulados del dashboard.
 *
 * Estaban repartidos dentro de `IndicatorsList`, `UpcomingSessions` y
 * `RecentActivity`, cada uno cargándolos con un `useEffect` que sólo servía para
 * fingir una petición: eran constantes, así que el efecto añadía un render de
 * más sin aportar nada.
 *
 * Aislarlos aquí los deja en un único fichero borrable de una vez, y sobre todo
 * hace evidente cuánto del dashboard es todavía ficticio.
 *
 * TODO: sustituir por un `DashboardRepository` -puerto en
 * `shared/domain/ports`, adaptador en `shared/infrastructure`- cuando exista el
 * esquema. `useDashboardSummary` es el único punto que habrá que tocar.
 */
export const dashboardSummaryMock: DashboardSummary = {
  indicators: [
    {
      id: 'active-students',
      title: 'Estudiantes Activos',
      indicator: 2,
      icon: Users,
      delta: 5,
      deltaType: 'up',
      period: 'month',
    },
    {
      id: 'weekly-sessions',
      title: 'Sesiones Esta Semana',
      indicator: 8,
      icon: CalendarDays,
      delta: 2,
      deltaType: 'up',
      period: 'week',
    },
    {
      id: 'monthly-revenue',
      title: 'Ingresos del Mes',
      indicator: 500,
      icon: BanknoteArrowUp,
      delta: 200,
      prefix: 'S/',
      deltaType: 'up',
      period: 'month',
    },
    {
      id: 'created-routines',
      title: 'Rutinas Creadas',
      indicator: 12,
      icon: BicepsFlexed,
      delta: 3,
      deltaType: 'up',
      period: 'month',
    },
  ],

  upcomingSessions: [
    {
      id: 'session-1',
      customer: 'María González',
      activity: 'Evaluación',
      scheduledDate: 'Hoy 9:00 AM',
      status: 'programmed',
    },
    {
      id: 'session-2',
      customer: 'Diego Ramírez',
      activity: 'Fuerza',
      scheduledDate: 'Hoy 9:30 AM',
      status: 'canceled',
    },
    {
      id: 'session-3',
      customer: 'Edward Mamani',
      activity: 'Fuerza',
      scheduledDate: 'Hoy 10:30 AM',
      status: 'confirmed',
    },
  ],

  recentActivity: [
    {
      id: 'activity-1',
      event: 'María completó su rutina de cardio',
      timeAgo: 'Hace 2 horas',
      color: 'primary',
    },
    {
      id: 'activity-2',
      event: 'Pago recibido de Diego Ramírez',
      timeAgo: 'Hace 1 día',
      color: 'green',
    },
    {
      id: 'activity-3',
      event: 'Nueva rutina creada: "Fuerza Avanzada"',
      timeAgo: 'Hace 2 días',
      color: 'secondary',
    },
  ],
}
