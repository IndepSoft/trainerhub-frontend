import type { Session } from '@/shared/domain/entities/session'
import {
  WILDCARD_CAP,
  WILDCARD_WEEKS,
  WILDCARD_WINDOW_DAYS,
  type StreakPause,
} from '@/shared/domain/entities/progress'
import { shiftDateKey, toLocalDateKey } from '@/shared/lib/dateKey'

/**
 * La racha protegida, EN MEMORIA. Espejo de `protected_streak` y
 * `wildcards_available` en SQL; la misma regla la usa la presentacion en
 * `progressRules.streakFrom`, que recibe las pausas.
 *
 * Un dia sin entrenar no rompe si esta cubierto por una pausa, o si es
 * descanso programado: no hay sesion ese dia y hay sesiones del mismo volcado
 * de plan antes y despues. Ese dia no suma: se salta.
 */
export function isPaused(day: string, pauses: StreakPause[]): boolean {
  return pauses.some((pause) => day >= pause.fromDay && day <= pause.toDay)
}

export function isPlannedRest(day: string, sessions: Session[]): boolean {
  if (sessions.some((session) => session.date === day)) return false
  const dumps = new Set(
    sessions
      .filter((session) => session.assignmentId !== undefined && session.date < day)
      .map((session) => session.assignmentId)
  )
  return sessions.some(
    (session) => session.assignmentId !== undefined && dumps.has(session.assignmentId) && session.date > day
  )
}

export function protectedStreak(sessions: Session[], pauses: StreakPause[], asof: string): number {
  const trained = new Set(
    sessions
      .filter((session) => session.status === 'completed' && session.result !== null)
      .map((session) => session.result?.completedAt ?? '')
  )
  let run = 0
  let cursor = asof
  for (let looked = 0; looked < 400; looked += 1) {
    if (trained.has(cursor)) run += 1
    else if (!isPaused(cursor, pauses) && !isPlannedRest(cursor, sessions)) break
    cursor = shiftDateKey(cursor, -1)
  }
  return run
}

function mondayOf(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return shiftDateKey(dayKey, -((date.getDay() + 6) % 7))
}

/** Semanas seguidas con al menos una sesion cerrada, terminando en la de hoy. */
export function weeksInARow(sessions: Session[], today: Date = new Date()): number {
  const trained = sessions
    .filter((session) => session.status === 'completed' && session.result !== null)
    .map((session) => session.result?.completedAt ?? '')
  let weeks = 0
  let weekStart = mondayOf(toLocalDateKey(today))
  const trainedIn = (start: string): boolean => {
    const end = shiftDateKey(start, 7)
    return trained.some((day) => day >= start && day < end)
  }
  while (trainedIn(weekStart) && weeks < 104) {
    weeks += 1
    weekStart = shiftDateKey(weekStart, -7)
  }
  return weeks
}

export function wildcardsAvailable(sessions: Session[], pauses: StreakPause[], today: Date = new Date()): number {
  const earned = Math.min(WILDCARD_CAP, Math.floor(weeksInARow(sessions, today) / WILDCARD_WEEKS))
  const since = shiftDateKey(toLocalDateKey(today), -WILDCARD_WINDOW_DAYS)
  const used = pauses.filter((pause) => pause.reason === 'wildcard' && pause.fromDay >= since).length
  return Math.max(0, earned - used)
}
