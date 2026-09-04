import type { TrainingPlan } from '../types/training.types'

/**
 * Cálculos derivados de un plan. Funciones puras, sin React.
 *
 * Mismo criterio que en la rutina: nada de esto se almacena. Un plan guarda sus
 * semanas y sus días; cuántas sesiones salen de ahí es una cuenta, y una cuenta
 * guardada miente en cuanto alguien mueve un día.
 */

/** Sesiones programadas en todo el mesociclo. Un día sin rutina es descanso. */
export function countPlanSessions(plan: TrainingPlan): number {
  return plan.weeks.reduce(
    (total, week) => total + week.days.filter((day) => day.routineId !== null).length,
    0
  )
}

/** Semanas de descarga, que es información de programación, no un detalle. */
export function countDeloadWeeks(plan: TrainingPlan): number {
  return plan.weeks.filter((week) => week.isDeload).length
}
