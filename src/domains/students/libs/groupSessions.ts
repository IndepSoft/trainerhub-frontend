import type { Session } from '@/shared/domain/entities/session'
import { isUpcomingSession } from '@/shared/domain/sessionLifecycle'

export interface SessionMonth {
  /** `YYYY-MM`. */
  monthKey: string
  /** De la más reciente a la más antigua. */
  sessions: Session[]
  /** Cuántas de ese mes se completaron. */
  completedCount: number
}

export interface GroupedSessions {
  /** Abiertas y por venir, de la más cercana a la más lejana. */
  upcoming: Session[]
  /** El resto —hechas, canceladas, las que no ocurrieron—, por mes. */
  months: SessionMonth[]
}

function chronologicalKey(session: Session): string {
  return `${session.date} ${session.time}`
}

/**
 * Las sesiones de un alumno como se leen en su ficha.
 *
 * LO PRÓXIMO ARRIBA Y EN ORDEN DE LLEGADA; lo pasado debajo, del más reciente
 * al más antiguo y partido por meses. Una sola lista ordenada por fecha
 * mezclaba las dos preguntas —qué le toca y qué ha hecho— y la primera, que es
 * la que se viene a hacer, quedaba al final de todo lo hecho.
 *
 * Qué es «por venir» lo decide `isUpcomingSession`, la misma regla que las
 * acciones en bloque: una sesión abierta de un día pasado no ocurrió, y va con
 * lo pasado.
 */
export function groupSessions(sessions: Session[], todayKey: string): GroupedSessions {
  const upcoming: Session[] = []
  const past: Session[] = []

  for (const session of sessions) {
    if (isUpcomingSession(session, todayKey)) upcoming.push(session)
    else past.push(session)
  }

  upcoming.sort((first, second) => chronologicalKey(first).localeCompare(chronologicalKey(second)))
  past.sort((first, second) => chronologicalKey(second).localeCompare(chronologicalKey(first)))

  const months: SessionMonth[] = []
  for (const session of past) {
    const monthKey = session.date.slice(0, 7)
    let month = months[months.length - 1]
    if (month === undefined || month.monthKey !== monthKey) {
      month = { monthKey, sessions: [], completedCount: 0 }
      months.push(month)
    }
    month.sessions.push(session)
    if (session.status === 'completed') month.completedCount += 1
  }

  return { upcoming, months }
}
