import { completedSessions } from '@/shared/domain/experience'
import type { Session } from '@/shared/domain/entities/session'
import type { SessionScore } from '@/shared/domain/entities/progress'

/** Una sesión cerrada, tal y como se lee en el historial. */
export interface HistoryEntry {
  sessionId: string
  title: string
  /** El día en que se CERRÓ, `YYYY-MM-DD`. Es el que ordena. */
  day: string
  completedSets: number
  totalSets: number
  minutes: number
  /**
   * Los puntos que le dio el servidor, o `null` si todavía no los ha escrito.
   *
   * `null` y no cero: las sesiones cerradas con la pantalla vieja —antes de
   * `score_session`— no tienen puntuación, y un cero diría que se entrenó para
   * nada. Se pinta un guion.
   */
  points: number | null
}

/** Un mes del historial, con lo que sumó. */
export interface HistoryMonth {
  /** `YYYY-MM`, para agrupar. El nombre lo pone el formato local. */
  month: string
  /** Un día de ese mes, que es lo que `formatMonthOfDateKey` sabe leer. */
  day: string
  /** La suma de los puntos del mes. Las sesiones sin puntuar no restan. */
  points: number
  entries: HistoryEntry[]
}

/**
 * El historial de sesiones: lo cerrado, con su puntuación al lado.
 *
 * SE JUNTA AQUÍ Y NO EN UNA CONSULTA APARTE. Las sesiones y las puntuaciones ya
 * las lee `useGamificationProfile` para la racha y el nivel; pedirlas otra vez
 * para el historial serían dos lecturas de lo mismo y dos ocasiones de
 * discrepar —la pantalla diría 326 XP arriba y otra cifra abajo—.
 *
 * Ordenado del día más reciente al más antiguo, que es como se lee un
 * historial. `sort` es estable, así que dos sesiones del mismo día conservan el
 * orden en que llegaron.
 */
export function historyFrom(sessions: Session[], scores: SessionScore[]): HistoryEntry[] {
  const pointsBySession = new Map(scores.map((score) => [score.sessionId, score.points]))
  const entries: HistoryEntry[] = []

  for (const session of completedSessions(sessions)) {
    // `completedSessions` ya garantiza el resultado; el compilador no lo sabe.
    const result = session.result
    if (result === null) continue

    entries.push({
      sessionId: session.id,
      title: session.title,
      day: result.completedAt,
      completedSets: result.completedSets,
      totalSets: result.totalSets,
      minutes: Math.round(result.elapsedSeconds / 60),
      points: pointsBySession.get(session.id) ?? null,
    })
  }

  return entries.sort((first, second) => second.day.localeCompare(first.day))
}

/**
 * El historial partido en meses, en el mismo orden.
 *
 * POR MESES Y NO POR SEMANAS: un mes es el tramo en el que alguien se pregunta
 * si ha entrenado bastante, y con dos o tres sesiones por semana los grupos
 * semanales serían más encabezados que filas.
 *
 * Recibe las entradas YA ORDENADAS —las de `historyFrom`— y las recorre una
 * vez: un mes empieza cuando cambia la clave, así que no hace falta ni mapa ni
 * segunda pasada.
 */
export function historyMonths(entries: HistoryEntry[]): HistoryMonth[] {
  const months: HistoryMonth[] = []

  for (const entry of entries) {
    const month = entry.day.slice(0, 7)
    const current = months.at(-1)

    if (current === undefined || current.month !== month) {
      months.push({ month, day: entry.day, points: entry.points ?? 0, entries: [entry] })
      continue
    }

    current.points += entry.points ?? 0
    current.entries.push(entry)
  }

  return months
}
