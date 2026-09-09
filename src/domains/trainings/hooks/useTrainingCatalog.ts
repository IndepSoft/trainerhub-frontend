import { useEffect, useMemo, useState } from 'react'
import { container } from '@/app/container'
import type { Exercise } from '../types/training.types'
import type {
  Equipment,
  MovementPattern,
  MuscleGroup,
  TrainingCatalog,
  TrainingObjective,
  TrainingSplit,
} from '../types/catalog.types'

interface UseTrainingCatalogResult {
  exercises: Exercise[]
  /** Material, editable por el entrenador. */
  equipment: Equipment[]
  /** Índice por id: una rutina guarda referencias, no copias. */
  exercisesById: Map<string, Exercise>
  muscleGroupsById: Map<string, MuscleGroup>
  equipmentById: Map<string, Equipment>
  movementPatternsById: Map<string, MovementPattern>
  objectivesById: Map<string, TrainingObjective>
  splitsById: Map<string, TrainingSplit>
}

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}

const EMPTY_CATALOG: TrainingCatalog = {
  muscleGroups: [],
  movementPatterns: [],
  equipment: [],
  objectives: [],
  splits: [],
}

/**
 * Los catálogos del entrenamiento: ejercicios y sus cinco tablas de referencia.
 *
 * TODO LLEGA POR EL PUERTO. Antes las cuatro tablas de sistema se leían de un
 * módulo de datos y el material de un almacén de `zustand`; ahora las cinco
 * salen de `container.catalog`, que en la simulación sirve la misma semilla y
 * contra Supabase las lee de la base. Es la costura que este hook llevaba
 * anunciando en su comentario: «cuando llegue el backend, esto llamará al
 * puerto». Llegó.
 *
 * Devuelve índices y no listas sueltas porque el uso real es siempre resolver
 * un identificador: una rutina guarda `exerciseId`, y pintarla exige convertirlo
 * en nombre. Buscar con `find` en cada ejercicio de cada bloque convierte el
 * pintado de una rutina en un recorrido cuadrático.
 */
export function useTrainingCatalog(): UseTrainingCatalogResult {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [catalog, setCatalog] = useState<TrainingCatalog>(EMPTY_CATALOG)

  useEffect(() => {
    let active = true

    const loadExercises = () => {
      container.exercises.findAll().then((result) => {
        if (active) setExercises(result)
      })
    }
    const loadCatalog = () => {
      container.catalog.findAll().then((result) => {
        if (active) setCatalog(result)
      })
    }

    loadExercises()
    loadCatalog()
    const unsubscribes = [
      container.exercises.onChange(loadExercises),
      container.catalog.onChange(loadCatalog),
    ]

    return () => {
      active = false
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [])

  return useMemo(
    () => ({
      exercises,
      equipment: catalog.equipment,
      exercisesById: indexById(exercises),
      muscleGroupsById: indexById(catalog.muscleGroups),
      equipmentById: indexById(catalog.equipment),
      movementPatternsById: indexById(catalog.movementPatterns),
      objectivesById: indexById(catalog.objectives),
      splitsById: indexById(catalog.splits),
    }),
    [exercises, catalog]
  )
}
