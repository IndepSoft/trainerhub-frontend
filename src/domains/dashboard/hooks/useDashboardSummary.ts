import { useCallback, useEffect, useState } from 'react'
import { BicepsFlexed, CalendarDays, Users } from 'lucide-react'
import { container } from '@/app/container'
import { describeTimeAgo, weekBounds } from '../libs/dashboardTime'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import type { DashboardSummary, RecentActivityEntry, UpcomingSession } from '../types/dashboard.types'
import type { Session } from '@/shared/domain/entities/session'
import type { Student } from '@/shared/domain/entities/student'

interface UseDashboardSummaryResult {
  summary: DashboardSummary
  loading: boolean
  error: string | null
  /** Vuelve a pedir los datos. La usa el gesto de tirar para recargar. */
  refresh: () => Promise<void>
}

/** Cuántas sesiones próximas y cuántas actividades caben sin llenar la página. */
const VISIBLE_UPCOMING = 3
const VISIBLE_ACTIVITY = 4

const EMPTY_SUMMARY: DashboardSummary = {
  indicators: [],
  upcomingSessions: [],
  recentActivity: [],
}

/**
 * Los datos del panel, DERIVADOS de los puertos.
 *
 * Antes venían enteros de un fichero de ejemplo: el panel enseñaba ocho sesiones
 * esta semana, doce rutinas creadas y una lista de próximas sesiones que no
 * existían en ninguna agenda. El entrenador hacía el trabajo y la pantalla de
 * resumen lo ignoraba.
 *
 * NO SE INVENTA LO QUE NO SE PUEDE CALCULAR. Los indicadores ya no llevan
 * tendencia —comparar con el periodo anterior exige un histórico que no hay— y
 * el de ingresos desapareció: no existe ninguna fuente de pagos, y una cifra
 * inventada en la primera pantalla es peor que un hueco. Vuelve cuando haya de
 * dónde sacarla.
 */
export function useDashboardSummary(): UseDashboardSummaryResult {
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)

    try {
      // En paralelo: son tres lecturas independientes y encadenarlas sólo
      // sumaría latencias cuando haya red de verdad.
      const [sessions, students, routines] = await Promise.all([
        container.sessions.findAll(),
        container.students.findAll(),
        container.routines.findAll(),
      ])

      setSummary(buildSummary(sessions, students, routines.length))
      setError(null)
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Error al cargar el panel')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()

    // El panel se entera de lo que pasa en la agenda sin recargar: marcar una
    // sesión como completada mueve tanto la lista como la actividad reciente.
    const unsubscribe = container.sessions.onChange(() => void load())
    return unsubscribe
  }, [load])

  return { summary, loading, error, refresh: load }
}

function buildSummary(
  sessions: Session[],
  students: Student[],
  routineCount: number
): DashboardSummary {
  const today = toLocalDateKey(new Date())
  const { from, to } = weekBounds(new Date())

  const studentsById = new Map(students.map((student) => [student.id, student]))
  const nameOf = (session: Session): string => {
    if (session.studentId === null) return 'Clase grupal'
    const student = studentsById.get(session.studentId)
    return student === undefined ? 'Alumno no disponible' : `${student.firstName} ${student.lastName}`
  }

  /*
   * Próximas: de hoy en adelante y sin las canceladas ni las ya hechas. «Lo que
   * viene» es lo que todavía puede ocurrir; incluir una cancelada convertiría la
   * lista en un histórico.
   */
  const upcomingSessions: UpcomingSession[] = sessions
    .filter(
      (session) =>
        session.date >= today && session.status !== 'cancelled' && session.status !== 'completed'
    )
    .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))
    .slice(0, VISIBLE_UPCOMING)
    .map((session) => ({ session, studentName: nameOf(session) }))

  const weeklySessions = sessions.filter(
    (session) => session.date >= from && session.date <= to && session.status !== 'cancelled'
  ).length

  /*
   * La actividad reciente son las sesiones COMPLETADAS, de la más nueva a la más
   * vieja. Antes era una lista escrita a mano; ahora es exactamente lo que ha
   * pasado, que es lo que la sección promete.
   */
  const recentActivity: RecentActivityEntry[] = sessions
    .filter((session) => session.status === 'completed')
    .sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`))
    .slice(0, VISIBLE_ACTIVITY)
    .map((session) => ({
      id: session.id,
      event: `${session.title} · ${nameOf(session)}`,
      timeAgo: describeTimeAgo(session.date),
      color: 'green',
    }))

  return {
    indicators: [
      {
        id: 'active-students',
        title: 'Estudiantes',
        indicator: students.length,
        icon: Users,
      },
      {
        id: 'weekly-sessions',
        title: 'Sesiones Esta Semana',
        indicator: weeklySessions,
        icon: CalendarDays,
      },
      {
        id: 'created-routines',
        title: 'Rutinas Creadas',
        indicator: routineCount,
        icon: BicepsFlexed,
      },
    ],
    upcomingSessions,
    recentActivity,
  }
}
