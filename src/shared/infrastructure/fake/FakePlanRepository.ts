import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { NewPlan, PlanRepository } from '@/shared/domain/ports/PlanRepository'
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

  // Campo declarado y asignado, no propiedad de parametro: `erasableSyntaxOnly`
  // esta activo en el `tsconfig`, y esa azucar de TypeScript emite codigo.
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<TrainingPlan[]> {
    return this.inScope()
  }

  async findById(planId: string): Promise<TrainingPlan | null> {
    return this.inScope().find((plan) => plan.id === planId) ?? null
  }

  async create(data: NewPlan): Promise<TrainingPlan> {
    const crewId = this.scope.current()
    if (crewId === null) {
      // Escribir sin crew dejaria un huerfano invisible: no lo veria nadie,
      // porque toda lectura esta acotada. Mejor fallar aqui que guardar algo
      // que despues no aparece y nadie sabe por que.
      throw new Error('No hay ningun crew activo.')
    }

    const plan: TrainingPlan = { id: crypto.randomUUID(), crewId, ...data }
    this.plans = [plan, ...this.plans]
    this.notify()
    return plan
  }

  async update(planId: string, data: NewPlan): Promise<void> {
    // Conserva la posicion: editar un plan no lo crea de nuevo. Y conserva
    // `crewId`: editarlo tampoco lo mueve de crew.
    this.plans = this.plans.map((plan) => (plan.id === planId ? { ...plan, ...data } : plan))
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

  /**
   * Lo que pertenece al crew activo.
   *
   * Sin crew activo devuelve vacio, y no todo: es el caso de una cuenta recien
   * registrada, y enseñarle los datos de otro equipo seria justo el fallo de
   * aislamiento que la multi-tenencia existe para evitar. Es lo que hara
   * Postgres con RLS cuando exista; ver `CrewScope`.
   */
  private inScope(): TrainingPlan[] {
    const crewId = this.scope.current()
    if (crewId === null) return []
    return this.plans.filter((entrada) => entrada.crewId === crewId)
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
