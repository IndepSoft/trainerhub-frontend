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
 * antes. El motivo es que aquí la marca `isTemplate` se lee en la tarjeta y no
 * en la pestaña: con una sola pestaña de planes la distinción sigue estando
 * visible, y una sexta pestaña no cabe en la barra a 375 px. La partición
 * existía sin que nadie la consumiera —el hook entero era código muerto— y
 * habría vuelto a separar en dos lo que es una sola entidad, que es exactamente
 * el error que hubo que deshacer en rutinas.
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
