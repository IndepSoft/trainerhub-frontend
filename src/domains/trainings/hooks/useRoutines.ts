import { useMemo } from 'react'
import { routinesMock } from '../data/routines.mock'
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
 * Misma costura que `useStudents` y `useCalendar`: cuando llegue el backend,
 * esto llamará al puerto vía `container` y ni la página ni los componentes se
 * enterarán.
 */
export function useRoutines(): UseRoutinesResult {
  return useMemo(
    () => ({
      routines: routinesMock.filter((routine) => !routine.isTemplate),
      templates: routinesMock.filter((routine) => routine.isTemplate),
      loading: false,
      error: null,
    }),
    []
  )
}
