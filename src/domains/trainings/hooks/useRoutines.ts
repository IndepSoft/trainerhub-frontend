import { routineTemplatesMock, routinesMock } from '../data/routines.mock'
import type { Routine } from '../types/training.types'

interface UseRoutinesResult {
  routines: Routine[]
  templates: Routine[]
  loading: boolean
  error: string | null
}

/**
 * Unica fuente de datos de rutinas.
 *
 * Misma costura que `useStudents` y `useCalendar`: cuando llegue el backend,
 * este hook pasara a llamar al puerto via `container` y ni la pagina ni los
 * componentes se enteraran.
 */
export function useRoutines(): UseRoutinesResult {
  return {
    routines: routinesMock,
    templates: routineTemplatesMock,
    loading: false,
    error: null,
  }
}
