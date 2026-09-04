import type { TrainingLevel } from './training.types'

/**
 * El plan mientras se está escribiendo.
 *
 * Mismo criterio que `RoutineDraft`: el borrador tiene la forma del formulario,
 * no la de la entidad. Los números son texto por lo mismo —un campo a medio
 * teclear está legítimamente vacío— y la conversión ocurre una vez, al guardar.
 */

/** Un día del microciclo. `routineId` vacío es descanso. */
export interface PlanDayDraft {
  /** 1 = lunes … 7 = domingo. */
  dayOfWeek: number
  routineId: string
}

/**
 * Una semana del borrador.
 *
 * Lleva `id` propio, que la entidad NO tiene: `PlanWeek` se identifica por su
 * `number`, y el número se deriva de la posición. Al borrar la semana 2, las
 * de abajo se renumeran, así que usar el número como clave de React haría que
 * React reutilizara el estado de la semana equivocada. El `id` es estable y
 * muere al guardar.
 */
export interface PlanWeekDraft {
  id: string
  isDeload: boolean
  days: PlanDayDraft[]
}

export interface PlanDraft {
  title: string
  description: string
  objectiveId: string
  splitId: string
  weeklyFrequency: string
  level: TrainingLevel
  weeks: PlanWeekDraft[]
}

export interface PlanDraftErrors {
  title?: string
  objectiveId?: string
  splitId?: string
  weeklyFrequency?: string
  weeks?: string
}
