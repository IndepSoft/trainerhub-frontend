import type { Session } from '@/shared/domain/entities/session'
import type { StudentBadge } from '@/shared/domain/entities/progress'
import { shiftDateKey } from '@/shared/lib/dateKey'

/**
 * Las reglas de las veinte insignias, EN MEMORIA, para la simulacion.
 *
 * Espejo de `evaluate_badges` en SQL, con la misma regla de lectura: al cerrar
 * cada sesion se mira la historia hasta ese dia, y lo que ya esta desbloqueado
 * no se vuelve a mirar. Se recorre la historia en orden para que cada insignia
 * quede con el dia y la sesion en que se consiguio.
 */

interface Snapshot {
  asof: string
  trainedDays: Set<string>
  completed: Session[]
  settled: Session[]
  sessionId: string
}

function mondayOf(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const isoWeekday = (date.getDay() + 6) % 7
  return shiftDateKey(dayKey, -isoWeekday)
}

function streakEndingAt(days: Set<string>, asof: string): number {
  let run = 0
  let cursor = asof
  while (days.has(cursor)) {
    run += 1
    cursor = shiftDateKey(cursor, -1)
  }
  return run
}

function mondaysEndingAt(days: Set<string>, asof: string): number {
  let run = 0
  let cursor = mondayOf(asof)
  while (days.has(cursor)) {
    run += 1
    cursor = shiftDateKey(cursor, -7)
  }
  return run
}

function weeksEndingAt(days: Set<string>, asof: string): number {
  let run = 0
  let weekStart = mondayOf(asof)
  const trainedIn = (start: string): boolean => {
    for (let offset = 0; offset < 7; offset += 1) {
      if (days.has(shiftDateKey(start, offset))) return true
    }
    return false
  }
  while (trainedIn(weekStart)) {
    run += 1
    weekStart = shiftDateKey(weekStart, -7)
  }
  return run
}

function overloadArchitect(completed: Session[], asof: string): boolean {
  // Mejor carga semanal por ejercicio; cuatro semanas seguidas subiendo,
  // terminando en la semana de asof.
  const weekly = new Map<string, Map<string, number>>()
  for (const session of completed) {
    const week = mondayOf(session.result?.completedAt ?? asof)
    for (const set of session.result?.sets ?? []) {
      if (set.weightKg === undefined) continue
      const byWeek = weekly.get(set.exerciseId) ?? new Map<string, number>()
      byWeek.set(week, Math.max(byWeek.get(week) ?? 0, set.weightKg))
      weekly.set(set.exerciseId, byWeek)
    }
  }
  const thisWeek = mondayOf(asof)
  for (const byWeek of weekly.values()) {
    const weights = [0, 1, 2, 3].map((back) => byWeek.get(shiftDateKey(thisWeek, -7 * back)))
    if (weights.every((weight) => weight !== undefined)) {
      const [w0, w1, w2, w3] = weights as number[]
      if (w0 > w1 && w1 > w2 && w2 > w3) return true
    }
  }
  return false
}

function comeback(trainedDays: Set<string>, completed: Session[], asof: string): boolean {
  const days = [...trainedDays].sort()
  for (let index = 1; index < days.length; index += 1) {
    const gap = daysBetween(days[index - 1], days[index])
    if (gap < 21) continue
    const returnDay = days[index]
    if (asof < returnDay || asof > shiftDateKey(returnDay, 6)) continue
    const since = completed.filter((session) => {
      const day = session.result?.completedAt ?? ''
      return day >= returnDay && day <= asof
    }).length
    if (since >= 3) return true
  }
  return false
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000)
}

function fullPlan(all: Session[], sessionId: string): boolean {
  const me = all.find((session) => session.id === sessionId)
  if (me === undefined || me.assignmentId === undefined) return false
  const siblings = all.filter((session) => session.assignmentId === me.assignmentId)
  const open = siblings.some((session) => session.status === 'pending' || session.status === 'confirmed')
  const done = siblings.filter((session) => session.status === 'completed').length
  return !open && done >= 8
}

/** Los codigos que se cumplen en una instantanea. */
function metCodes(snapshot: Snapshot, all: Session[]): string[] {
  const { asof, trainedDays, completed, settled, sessionId } = snapshot
  const totalSets = completed.reduce((total, session) => total + (session.result?.completedSets ?? 0), 0)
  const totalHours = completed.reduce((total, session) => total + (session.result?.elapsedSeconds ?? 0), 0) / 3600
  const cardioMinutes = completed
    .filter((session) => session.modality === 'cardio')
    .reduce((total, session) => total + (session.result?.elapsedSeconds ?? 0), 0) / 60
  const withWeight = completed.filter((session) =>
    (session.result?.sets ?? []).some((set) => set.weightKg !== undefined)
  ).length
  const firstDay = [...trainedDays].sort()[0] ?? asof
  const inFirstMonth = completed.filter((session) => {
    const day = session.result?.completedAt ?? ''
    return day >= firstDay && day <= shiftDateKey(firstDay, 29)
  }).length
  const inLast30 = completed.filter((session) => (session.result?.completedAt ?? '') >= shiftDateKey(asof, -29)).length
  const early = completed.filter((session) => session.time === '08:00').length
  const settledCompleted = settled.filter((session) => session.status === 'completed').length
  const streak = streakEndingAt(trainedDays, asof)
  const mondays = mondaysEndingAt(trainedDays, asof)
  const weeks = weeksEndingAt(trainedDays, asof)

  const rules: [string, boolean][] = [
    ['first-session', completed.length >= 1],
    ['first-weight', withWeight >= 1],
    ['iron-foundation', inFirstMonth >= 12],
    ['cardio-hour', cardioMinutes >= 60],
    ['perfect-week', streak >= 7],
    ['never-miss-monday', mondays >= 4],
    ['early-bird', early >= 10],
    ['monthly-warrior', inLast30 > 20],
    ['habit-former', streak >= 21],
    ['hundred-sets', totalSets >= 100],
    ['ten-hours', totalHours >= 10],
    ['overload-architect', overloadArchitect(completed, asof)],
    ['comeback', comeback(trainedDays, completed, asof)],
    ['iron-will', settled.length >= 10 && settledCompleted / settled.length >= 0.9],
    ['eight-weeks', weeks >= 8],
    ['thousand-sets', totalSets >= 1000],
    ['full-plan', fullPlan(all, sessionId)],
    ['unstoppable', streak >= 50],
    ['legend', streak >= 100],
    ['persistence', weeks >= 52],
  ]
  return rules.filter(([, met]) => met).map(([code]) => code)
}

/**
 * Las insignias de un alumno, recorriendo su historia en orden.
 *
 * `all` son TODAS sus sesiones -cerradas o no- porque «voluntad de hierro»
 * mira las canceladas y «plan entero» las pendientes del mismo volcado.
 */
export function unlockBadges(studentId: string, all: Session[]): StudentBadge[] {
  const completed = all
    .filter((session) => session.status === 'completed' && session.result !== null)
    .sort((left, right) => (left.result?.completedAt ?? '').localeCompare(right.result?.completedAt ?? ''))

  const unlocked = new Map<string, StudentBadge>()
  for (const session of completed) {
    const asof = session.result?.completedAt ?? ''
    const upTo = completed.filter((candidate) => (candidate.result?.completedAt ?? '') <= asof)
    const snapshot: Snapshot = {
      asof,
      sessionId: session.id,
      completed: upTo,
      trainedDays: new Set(upTo.map((candidate) => candidate.result?.completedAt ?? '')),
      settled: all.filter(
        (candidate) =>
          (candidate.status === 'completed' || candidate.status === 'cancelled') && candidate.date <= asof
      ),
    }
    for (const code of metCodes(snapshot, all)) {
      if (unlocked.has(code)) continue
      unlocked.set(code, {
        studentId,
        code,
        unlockedOn: asof,
        sessionId: session.id,
        validatedAt: null,
      })
    }
  }

  return [...unlocked.values()].sort((left, right) => right.unlockedOn.localeCompare(left.unlockedOn))
}
