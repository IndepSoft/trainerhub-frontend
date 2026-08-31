import { plansMock } from '../data/plans.mock'
import type { TrainingPlan } from '../types/training.types'

interface UsePlansResult {
  plans: TrainingPlan[]
  loading: boolean
  error: string | null
}

/**
 * Planes de entrenamiento.
 *
 * Devuelve UNA lista, no la partición en propios y plantillas que devolvía
 * antes. La marca que la sostenía ya no existe en el modelo: no gobernaba
 * ningún comportamiento y, sin nada asignado a ningún estudiante, todos los
 * planes eran igualmente plantillas. El razonamiento está en
 * `types/training.types.ts`.
 *
 * TODO: sustituir por el repositorio cuando exista el backend. Este hook es el
 * único punto que habrá que tocar.
 */
export function usePlans(): UsePlansResult {
  return {
    plans: plansMock,
    loading: false,
    error: null,
  }
}
