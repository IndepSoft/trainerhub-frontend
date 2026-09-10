import type { Session, SetRecord } from '@/shared/domain/entities/session'
import type { Student } from '@/shared/domain/entities/student'
import { ageOf } from '@/shared/domain/entities/student'
import { SCORE_RULE_VERSION, type SessionScore } from '@/shared/domain/entities/progress'
import { shiftDateKey } from '@/shared/lib/dateKey'

/**
 * La regla de puntuacion, version 1, EN MEMORIA.
 *
 * Es el espejo de `score_session` en SQL, y existe solo para la simulacion:
 * la suite de interfaz vive de las semillas y necesita que cerrar una sesion
 * puntue igual que en la base. La prueba de contrato afirma lo que hace el
 * servidor; la unitaria, que este espejo dice lo mismo. Si divergen, la que
 * manda es la base.
 *
 *   puntos     = base × adherencia × progreso × cohorte, redondeado
 *   base       = 20 + min(series hechas, series previstas)      fuerza
 *              = 20 + min(minutos, duracion prevista) / 5        cardio
 *   adherencia = hecho / previsto, acotado a [0,80, 1,10]
 *   progreso   = 1 + 0,15 × (ejercicios mejorados / con referencia)
 *   cohorte    = por edad y nivel
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function cohortFactor(student: Student | undefined, today: Date = new Date()): number {
  const age = student === undefined ? null : ageOf(student.birthDate, today)
  if (age === null) return 1
  if (age < 18) return 1.15
  if (age > 45) return 1.2
  if (student?.level === 'Avanzado') return 0.85
  return 1
}

function bestByExercise(sets: SetRecord[]): Map<string, { weight: number; clean: boolean }> {
  const best = new Map<string, { weight: number; clean: boolean }>()
  for (const set of sets) {
    if (set.weightKg === undefined) continue
    const clean = set.rpe === undefined || set.rpe <= 8
    const current = best.get(set.exerciseId)
    if (current === undefined || set.weightKg > current.weight) {
      best.set(set.exerciseId, { weight: set.weightKg, clean })
    } else if (set.weightKg === current.weight && clean) {
      current.clean = true
    }
  }
  return best
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

/**
 * Por ejercicio con peso, la mejor carga de esta sesion contra la mediana de
 * las mejores cargas de las cuatro semanas anteriores. Una mejora con RPE
 * mayor que 8 no cuenta: es una serie forzada, no una progresion.
 */
export function progressFactor(session: Session, history: Session[]): number {
  if (session.result === null) return 1
  const own = bestByExercise(session.result.sets ?? [])
  if (own.size === 0) return 1

  const completedOn = session.result.completedAt
  const since = shiftDateKey(completedOn, -28)
  const previous = new Map<string, number[]>()
  for (const other of history) {
    if (other.id === session.id || other.status !== 'completed' || other.result === null) continue
    const day = other.result.completedAt
    if (day >= completedOn || day < since) continue
    for (const [exerciseId, best] of bestByExercise(other.result.sets ?? [])) {
      previous.set(exerciseId, [...(previous.get(exerciseId) ?? []), best.weight])
    }
  }

  let withBaseline = 0
  let improved = 0
  for (const [exerciseId, best] of own) {
    const baseline = previous.get(exerciseId)
    if (baseline === undefined) continue
    withBaseline += 1
    if (best.weight > median(baseline) && best.clean) improved += 1
  }

  if (withBaseline === 0) return 1
  return round2(1 + (0.15 * improved) / withBaseline)
}

/** Lo que valio una sesion cerrada, o `null` si no puntua: sin resultado, o grupal. */
export function scoreSession(
  session: Session,
  history: Session[],
  student: Student | undefined,
  today: Date = new Date()
): SessionScore | null {
  if (session.status !== 'completed' || session.result === null || session.studentId === null) {
    return null
  }

  let planned: number
  let done: number
  let base: number
  if (session.modality === 'cardio') {
    planned = session.durationMinutes
    done = session.result.elapsedSeconds / 60
    base = 20 + Math.min(done, planned) / 5
  } else {
    planned = session.result.totalSets
    done = session.result.completedSets
    base = 20 + Math.min(done, planned)
  }

  const adherence = planned > 0 ? clamp(round2(done / planned), 0.8, 1.1) : 1
  const progress = progressFactor(session, history)
  const cohort = cohortFactor(student, today)

  return {
    sessionId: session.id,
    studentId: session.studentId,
    crewId: session.crewId,
    completedOn: session.result.completedAt,
    base: round2(base),
    adherence,
    progress,
    cohort,
    points: Math.round(base * adherence * progress * cohort),
    ruleVersion: SCORE_RULE_VERSION,
  }
}
