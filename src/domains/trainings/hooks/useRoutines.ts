import { useRoutinesStore } from '../stores/routinesStore'
import type { Routine } from '../types/training.types'

interface UseRoutinesResult {
  routines: Routine[]
  loading: boolean
  error: string | null
}

/**
 * Única fuente de datos de rutinas.
 *
 * Devuelve UNA lista. Antes devolvía dos, partidas por `isTemplate`, y esa marca
 * ha desaparecido del modelo: no gobernaba ningún comportamiento, y con nada
 * asignado a ningún estudiante todas las rutinas eran igualmente plantillas. El
 * razonamiento completo está en `types/training.types.ts`.
 *
 * Lee del almacén y no del fichero de datos simulados, que ha pasado a ser su
 * semilla. Ese cambio es lo que permite que una rutina recién creada aparezca
 * aquí: leyendo el módulo directamente, la lista nunca se habría enterado.
 */
export function useRoutines(): UseRoutinesResult {
  const routines = useRoutinesStore((state) => state.routines)

  return { routines, loading: false, error: null }
}
