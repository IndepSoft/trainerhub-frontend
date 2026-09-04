import type { TrainingPlan } from '../entities/plan'

/**
 * Puerto de acceso a planes.
 *
 * Nace cuando la ficha del estudiante puede tener un plan asignado: hasta
 * entonces solo los usaba `trainings`. Misma forma que `RoutineRepository`,
 * incluida `onChange`, y por el mismo motivo: sin ella una lista ya montada no
 * se entera de lo que otra vista acaba de crear o borrar.
 */
export interface PlanRepository {
  findAll(): Promise<TrainingPlan[]>
  findById(planId: string): Promise<TrainingPlan | null>
  create(data: NewPlan): Promise<TrainingPlan>
  update(planId: string, data: NewPlan): Promise<void>
  remove(planId: string): Promise<void>
  onChange(listener: () => void): () => void
}

/**
 * Los datos de un alta. Sin `crewId`: lo pone el adaptador desde el ámbito
 * activo, para que ningún formulario tenga que saber de multi-tenencia ni pueda
 * equivocarse de crew. Ver `CrewScope`.
 */
export type NewPlan = Omit<TrainingPlan, 'id' | 'crewId'>
