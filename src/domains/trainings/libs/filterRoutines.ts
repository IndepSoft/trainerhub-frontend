import type { Routine, TrainingLevel } from '@/shared/domain/entities/routine'
import { normalizeForSearch } from '@/shared/lib/searchText'

/** Lo que la barra de filtros de rutinas deja elegir. */
export interface RoutineFilterState {
  query: string
  level: TrainingLevel | 'all'
}

export const EMPTY_ROUTINE_FILTERS: RoutineFilterState = { query: '', level: 'all' }

/**
 * Filtra las rutinas en memoria, por el mismo criterio que `filterStudents`:
 * una lista corta ya cargada se filtra donde está, y el puerto sigue hablando
 * de negocio y no de consulta.
 */
export function filterRoutines(routines: Routine[], filters: RoutineFilterState): Routine[] {
  const needle = normalizeForSearch(filters.query)

  return routines.filter((routine) => {
    if (filters.level !== 'all' && routine.level !== filters.level) return false
    if (needle === '') return true

    return normalizeForSearch(`${routine.title} ${routine.description}`).includes(needle)
  })
}
