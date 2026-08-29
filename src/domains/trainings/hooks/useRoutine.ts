import { routineTemplatesMock, routinesMock } from '../data/routines.mock'
import type { Routine } from '../types/training.types'

interface UseRoutineResult {
  routine: Routine | null
  loading: boolean
  error: string | null
}

/**
 * Una rutina por su identificador.
 *
 * Busca en rutinas propias y en plantillas: desde la vista, ambas son rutinas
 * abribles, y que estén en dos colecciones distintas es un detalle de cómo se
 * almacenan hoy. Devuelve `null` cuando no existe, no una excepción.
 */
export function useRoutine(routineId: string | undefined): UseRoutineResult {
  if (!routineId) {
    return { routine: null, loading: false, error: null }
  }

  const routine =
    [...routinesMock, ...routineTemplatesMock].find(
      (candidate) => candidate.id === routineId
    ) ?? null

  return { routine, loading: false, error: null }
}
