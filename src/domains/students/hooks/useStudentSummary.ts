import { useEffect, useMemo, useState } from 'react'
import { container } from '@/app/container'
import { streakFrom } from '@/domains/progress/libs/progressRules'
import { isUpcomingSession } from '@/shared/domain/sessionLifecycle'
import { todayKey } from '@/shared/lib/dateKey'
import type { Session } from '@/shared/domain/entities/session'
import { useStudentSessions } from './useStudentSessions'
import { useStudentsProgress } from './useStudentsProgress'
import { useStudentRoute } from './useStudentRoute'

interface UseStudentSummaryResult {
  /** Sesiones cerradas, del mismo agregado que la lista. `null` mientras carga. */
  completedSessions: number | null
  /** La racha protegida, en días. `null` mientras carga. */
  streakDays: number | null
  /** La próxima sesión por venir, o `null` si no hay ninguna. */
  nextSession: Session | null
  /** El nodo cuyo hito cumple y sólo espera la validación, o `null`. */
  awaitingMilestone: number | null
  /** Insignias de Platino o Diamante que esperan confirmación. */
  pendingBadgeCount: number
  /** Sesiones marcadas por salto de carga y sin revisar. */
  flaggedCount: number
  loading: boolean
}

/**
 * Lo que el resumen de una ficha enseña de un vistazo.
 *
 * COMPONE, NO CALCULA REGLAS. Las sesiones cerradas salen del mismo agregado
 * que la fila del padrón —si las dos contaran por su cuenta, acabarían
 * discrepando—; la racha, de `streakFrom` con las pausas, que es la misma
 * función con la que el alumno ve la suya; y el hito pendiente lo dice el
 * SERVIDOR (`pendingMilestones`), no una tercera copia de los umbrales: la
 * regla vive en SQL y en su espejo simulado, y nada más.
 */
export function useStudentSummary(studentId: string): UseStudentSummaryResult {
  const { sessions, loading: loadingSessions } = useStudentSessions(studentId)
  const { progressById, loading: loadingProgress } = useStudentsProgress()
  const { pauses, pendingBadges, flagged, loading: loadingRoute } = useStudentRoute(studentId)
  const [awaitingMilestone, setAwaitingMilestone] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    // Una lectura del equipo filtrada aquí: el puerto sólo sabe responder
    // por equipo, que es lo que necesita la bandeja del panel.
    const load = () => {
      container.routes
        .pendingMilestones()
        .then((milestones) => {
          if (!active) return
          const own = milestones.find((milestone) => milestone.studentId === studentId)
          setAwaitingMilestone(own?.position ?? null)
        })
        .catch(() => {
          // Sin la respuesta no se inventa un hito: la fila, sencillamente, no
          // sale. La sección de progreso, que sí lo necesita, dice el error.
          if (active) setAwaitingMilestone(null)
        })
    }

    load()
    const unsubscribe = container.routes.onChange(load)
    return () => {
      active = false
      unsubscribe()
    }
  }, [studentId])

  const nextSession = useMemo(() => {
    const today = todayKey()
    const upcoming = sessions.filter((session) => isUpcomingSession(session, today))
    upcoming.sort((first, second) =>
      `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`)
    )
    return upcoming[0] ?? null
  }, [sessions])

  const streakDays = useMemo(
    () => (loadingSessions || loadingRoute ? null : streakFrom(sessions, new Date(), pauses).currentDays),
    [sessions, pauses, loadingSessions, loadingRoute]
  )

  return {
    completedSessions: loadingProgress ? null : (progressById.get(studentId)?.completedSessions ?? 0),
    streakDays,
    nextSession,
    awaitingMilestone,
    pendingBadgeCount: pendingBadges.length,
    flaggedCount: flagged.length,
    loading: loadingSessions || loadingProgress || loadingRoute,
  }
}
