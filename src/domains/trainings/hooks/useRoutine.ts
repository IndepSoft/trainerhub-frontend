import { routinesMock } from '../data/routines.mock'
import type { Routine } from '../types/training.types'

interface UseRoutineResult {
  routine: Routine | null
  loading: boolean
  error: string | null
}

/**
 * Una rutina por su identificador.
 *
 * Rutinas y plantillas son la misma entidad, asi que la busqueda es una sola.
 * Devuelve `null` cuando no existe, no una excepcion: un enlace viejo es un
 * resultado valido y la vista debe poder pintarlo.
 */
export function useRoutine(routineId: string | undefined): UseRoutineResult {
  if (!routineId) {
    return { routine: null, loading: false, error: null }
  }

  // Una sola coleccion: rutinas y plantillas son la misma entidad, distinguidas
  // por `isTemplate`. Buscar en dos arrays era el sintoma de tenerlas separadas.
  const routine = routinesMock.find((candidate) => candidate.id === routineId) ?? null

  return { routine, loading: false, error: null }
}
