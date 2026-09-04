import { useEffect, useMemo, useState } from 'react'
import { container } from '@/app/container'
import { useCatalogStore } from '../stores/catalogStore'
import {
  MOVEMENT_PATTERNS,
  MUSCLE_GROUPS,
  TRAINING_OBJECTIVES,
  TRAINING_SPLITS,
} from '../data/catalog.mock'
import type { Exercise } from '../types/training.types'
import type {
  Equipment,
  MovementPattern,
  MuscleGroup,
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

/**
 * Los catálogos del entrenamiento: ejercicios y sus cinco tablas de referencia.
 *
 * Se llamaba `useExerciseCatalog` y sólo servía tres de las cinco tablas, así
 * que los objetivos y las divisiones no tenían por dónde llegar a una vista: el
 * plan los referencia y no había forma de resolver el identificador en nombre.
 * El nombre nuevo dice lo que hay —el catálogo del entrenamiento, no sólo el de
 * ejercicios— y evita tener dos hooks leyendo el mismo módulo de datos.
 *
 * Devuelve índices y no listas sueltas porque el uso real es siempre resolver
 * un identificador: una rutina guarda `exerciseId`, y pintarla exige convertirlo
 * en nombre. Buscar con `find` en cada ejercicio de cada bloque convierte el
 * pintado de una rutina en un recorrido cuadrático.
 *
 * Ejercicios y equipamiento vienen del almacén, que admite altas y ediciones;
 * las otras cuatro tablas se sirven tal cual desde los datos, porque son
 * vocabulario del sistema y no se editan. La diferencia está razonada en
 * `stores/catalogStore.ts`.
 *
 * Misma costura que el resto: cuando llegue el backend, esto llamará al puerto
 * vía `container` y ni la página ni los componentes se enterarán.
 */
export function useTrainingCatalog(): UseTrainingCatalogResult {
  /*
   * Los ejercicios vienen del PUERTO desde que la sesion en vivo tambien los
   * lee; el equipamiento sigue en el almacen del dominio porque solo lo mira
   * `trainings`. Es la misma frontera de siempre: sube lo que cruza.
   */
  const [exercises, setExercises] = useState<Exercise[]>([])

  useEffect(() => {
    let active = true

    const load = () => {
      container.exercises.findAll().then((result) => {
        if (active) setExercises(result)
      })
    }

    load()
    const unsubscribe = container.exercises.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const equipment = useCatalogStore((state) => state.equipment)

  return useMemo(
    () => ({
      exercises,
      equipment,
      exercisesById: indexById(exercises),
      muscleGroupsById: indexById(MUSCLE_GROUPS),
      equipmentById: indexById(equipment),
      movementPatternsById: indexById(MOVEMENT_PATTERNS),
      objectivesById: indexById(TRAINING_OBJECTIVES),
      splitsById: indexById(TRAINING_SPLITS),
    }),
    [exercises, equipment]
  )
}
