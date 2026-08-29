import { plansMock } from '../data/plans.mock'
import type { TrainingPlan } from '../types/training.types'

interface UsePlansResult {
  plans: TrainingPlan[]
  templates: TrainingPlan[]
  loading: boolean
  error: string | null
}

/**
 * Planes de entrenamiento.
 *
 * Separa los propios de las plantillas por la marca `isTemplate`, no por dos
 * colecciones distintas: son la misma entidad y guardarlas aparte es lo que hizo
 * que en rutinas hubiera dos listas con el mismo contenido.
 */
export function usePlans(): UsePlansResult {
  return {
    plans: plansMock.filter((plan) => !plan.isTemplate),
    templates: plansMock.filter((plan) => plan.isTemplate),
    loading: false,
    error: null,
  }
}
