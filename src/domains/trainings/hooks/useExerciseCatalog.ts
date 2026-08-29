import { useMemo } from 'react'
import { exercisesMock } from '../data/exercises.mock'
import {
  EQUIPMENT,
  MOVEMENT_PATTERNS,
  MUSCLE_GROUPS,
} from '../data/catalog.mock'
import type { Exercise } from '../types/training.types'
import type { Equipment, MovementPattern, MuscleGroup } from '../types/catalog.types'

interface UseExerciseCatalogResult {
  exercises: Exercise[]
  /** Índice por id: una rutina guarda referencias, no copias. */
  exercisesById: Map<string, Exercise>
  muscleGroupsById: Map<string, MuscleGroup>
  equipmentById: Map<string, Equipment>
  movementPatternsById: Map<string, MovementPattern>
}

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}

/**
 * Catálogo de ejercicios y sus tablas de referencia.
 *
 * Devuelve índices y no listas sueltas porque el uso real es siempre resolver
 * un identificador: una rutina guarda `exerciseId`, y pintarla exige convertirlo
 * en nombre. Buscar con `find` en cada ejercicio de cada bloque convierte el
 * pintado de una rutina en un recorrido cuadrático.
 *
 * Misma costura que el resto: cuando llegue el backend, esto llamará al puerto
 * vía `container` y ni la página ni los componentes se enterarán.
 */
export function useExerciseCatalog(): UseExerciseCatalogResult {
  return useMemo(
    () => ({
      exercises: exercisesMock,
      exercisesById: indexById(exercisesMock),
      muscleGroupsById: indexById(MUSCLE_GROUPS),
      equipmentById: indexById(EQUIPMENT),
      movementPatternsById: indexById(MOVEMENT_PATTERNS),
    }),
    []
  )
}
