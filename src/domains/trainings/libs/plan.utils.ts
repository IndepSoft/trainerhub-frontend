import type { PlanWeek, TrainingPlan } from '../types/training.types'

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

export interface WeekSummary {
  /** Los días con rutina, del 1 (lunes) al 7, en orden. */
  trainingDays: number[]
  /** Los días sin rutina. Se cuentan, no se listan. */
  restDays: number
}

/**
 * Lo que dice una semana cerrada: qué días se entrena y cuántos se descansa.
 *
 * Es lo que permite PLEGAR las semanas de un plan: la fila cerrada tiene que
 * decir «lunes, miércoles y viernes» para que no haga falta abrirla, y los
 * descansos, que eran cuatro filas de «Descanso», se cuentan.
 */
export function summarizeWeek(week: PlanWeek): WeekSummary {
  const trainingDays = week.days
    .filter((day) => day.routineId !== null)
    .map((day) => day.dayOfWeek)
    .sort((first, second) => first - second)
  return { trainingDays, restDays: week.days.length - trainingDays.length }
}

/** Semanas de descarga, que es información de programación, no un detalle. */
export function countDeloadWeeks(plan: TrainingPlan): number {
  return plan.weeks.filter((week) => week.isDeload).length
}
