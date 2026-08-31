import { useMemo } from 'react'
import { useRoutinesStore } from '../stores/routinesStore'
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
 *
 * El caso «sin identificador» se resuelve DENTRO del memo y no con un retorno
 * temprano. Antes salía antes de tiempo; no fallaba porque el hook no llamaba a
 * ningún otro, pero dejaba una trampa armada: el primer `useMemo` que alguien
 * añadiera arriba pasaría a ejecutarse de forma condicional.
 */
export function useRoutine(routineId: string | undefined): UseRoutineResult {
  const routines = useRoutinesStore((state) => state.routines)

  const routine = useMemo(() => {
    if (!routineId) return null
    return routines.find((candidate) => candidate.id === routineId) ?? null
  }, [routines, routineId])

  return { routine, loading: false, error: null }
}
