import type { PlanRepository } from '@/shared/domain/ports/PlanRepository'
import type { TrainingPlan } from '@/shared/domain/entities/plan'
import { plansSeed } from './plansSeed'

/**
 * Planes simulados mientras no hay backend.
 *
 * Misma forma y mismo razonamiento que `FakeRoutineRepository`.
 *
 * TODO: los datos viven solo en memoria. Al recargar vuelve la semilla.
 */
export class FakePlanRepository implements PlanRepository {
  private plans: TrainingPlan[] = plansSeed
  private readonly listeners = new Set<() => void>()

  async findAll(): Promise<TrainingPlan[]> {
    return this.plans
  }

  async findById(planId: string): Promise<TrainingPlan | null> {
    return this.plans.find((plan) => plan.id === planId) ?? null
  }

  async create(data: Omit<TrainingPlan, 'id'>): Promise<TrainingPlan> {
    const plan: TrainingPlan = { id: crypto.randomUUID(), ...data }
    this.plans = [plan, ...this.plans]
    this.notify()
    return plan
  }

  async update(planId: string, data: Omit<TrainingPlan, 'id'>): Promise<void> {
    // Conserva la posicion: editar un plan no lo crea de nuevo.
    this.plans = this.plans.map((plan) => (plan.id === planId ? { id: planId, ...data } : plan))
    this.notify()
  }

  async remove(planId: string): Promise<void> {
    this.plans = this.plans.filter((plan) => plan.id !== planId)
    this.notify()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
