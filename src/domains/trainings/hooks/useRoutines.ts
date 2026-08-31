import { useMemo } from 'react'
import { useRoutinesStore } from '../stores/routinesStore'
import type { Routine } from '../types/training.types'

interface UseRoutinesResult {
  /** Rutinas propias del entrenador. */
  routines: Routine[]
  /** Las marcadas como reutilizables. */
  templates: Routine[]
  loading: boolean
  error: string | null
}

/**
 * Única fuente de datos de rutinas.
 *
 * Las dos listas se DERIVAN de una sola colección, filtrando por `isTemplate`.
 * Antes eran dos arrays separados y el flag no lo leía nadie: se podía marcar
 * `isTemplate: true` en la lista de rutinas y no pasaba absolutamente nada, con
 * lo que la marca era decorativa y la única fuente de verdad seguía siendo en
 * qué array estaba escrita la rutina.
 *
 * Lee del almacén y ya no del fichero de datos simulados, que ha pasado a ser
 * su semilla. Ese cambio es lo que permite que una rutina recién creada aparezca
 * aquí: leyendo el módulo directamente, la lista nunca se habría enterado.
 */
export function useRoutines(): UseRoutinesResult {
  const routines = useRoutinesStore((state) => state.routines)

  return useMemo(
    () => ({
      routines: routines.filter((routine) => !routine.isTemplate),
      templates: routines.filter((routine) => routine.isTemplate),
      loading: false,
      error: null,
    }),
    [routines]
  )
}
