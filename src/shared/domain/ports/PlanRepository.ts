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
  create(data: Omit<TrainingPlan, 'id'>): Promise<TrainingPlan>
  update(planId: string, data: Omit<TrainingPlan, 'id'>): Promise<void>
  remove(planId: string): Promise<void>
  onChange(listener: () => void): () => void
}
