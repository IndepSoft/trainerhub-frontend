import type { Session } from '@/shared/domain/entities/session'
import type { Assignment } from '@/shared/domain/entities/assignment'
import type { TrainingPlan } from '@/shared/domain/entities/plan'
import {
  ADHERENCE_THRESHOLD,
  ROUTE_BY_OBJECTIVE,
  ROUTE_NODES,
  type ProgressRouteCode,
} from '@/shared/domain/entities/progress'
import { shiftDateKey, toLocalDateKey } from '@/shared/lib/dateKey'

/**
 * Las reglas de las rutas, EN MEMORIA, para la simulacion. Espejo de
 * `route_of_student`, `adherent_weeks` y `route_progress` en SQL.
 */

function mondayOf(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const isoWeekday = (date.getDay() + 6) % 7
  return shiftDateKey(dayKey, -isoWeekday)
}

/** La ruta del objetivo del ultimo plan asignado, o Hybrid. */
export function routeFromAssignments(
  assignments: Assignment[],
  plansById: ReadonlyMap<string, TrainingPlan>
): ProgressRouteCode {
  const latest = assignments
    .filter((assignment) => assignment.kind === 'plan')
    .sort((left, right) => right.assignedOn.localeCompare(left.assignedOn))[0]
  if (latest === undefined || latest.kind !== 'plan') return 'hybrid'
  const plan = plansById.get(latest.planId)
  if (plan === undefined) return 'hybrid'
  return ROUTE_BY_OBJECTIVE[plan.objectiveId] ?? 'hybrid'
}

/**
 * Semanas seguidas de adherencia, terminando en la semana de `asof`.
 *
 * Una semana es adherente si cerro al menos el 85 % de lo que tenia decidido:
 * cerradas sobre cerradas mas canceladas mas las que quedaron sin hacer y ya
 * pasaron. Una semana sin nada programado no rompe la cadena ni la alarga.
 */
export function adherentWeeks(sessions: Session[], asof: Date = new Date()): number {
  const asofKey = toLocalDateKey(asof)
  let weeks = 0
  let weekStart = mondayOf(asofKey)

  for (let looked = 0; looked < 60; looked += 1) {
    const weekEnd = shiftDateKey(weekStart, 7)
    const inWeek = sessions.filter((session) => session.date >= weekStart && session.date < weekEnd)
    const decided = inWeek.filter(
      (session) =>
        session.status === 'completed' ||
        session.status === 'cancelled' ||
        ((session.status === 'pending' || session.status === 'confirmed') && session.date < asofKey)
    )
    const done = decided.filter((session) => session.status === 'completed').length

    if (decided.length > 0) {
      if (done / decided.length >= ADHERENCE_THRESHOLD) weeks += 1
      else break
    }
    weekStart = shiftDateKey(weekStart, -7)
  }

  return weeks
}

/** El nodo en el que se esta: se sube mientras el siguiente cumpla las tres cosas. */
export function positionFrom(points: number, weeks: number, validated: number[]): number {
  let node = 1
  for (const next of ROUTE_NODES) {
    if (next.position !== node + 1) continue
    if (points < next.pointsRequired || weeks < next.weeksRequired || !validated.includes(next.position)) break
    node += 1
  }
  return node
}
