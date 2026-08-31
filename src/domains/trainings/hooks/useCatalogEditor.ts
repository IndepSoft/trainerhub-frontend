import { useCallback } from 'react'
import { useCatalogStore } from '../stores/catalogStore'
import { useRoutines } from './useRoutines'
import {
  describeNames,
  findExercisesUsingEquipment,
  findRoutinesUsingExercise,
} from '../libs/usage'
import type { Exercise } from '../types/training.types'
import type { Equipment } from '../types/catalog.types'
import type { DeletionResult } from '../types/deletion.types'

interface UseCatalogEditorResult {
  createExercise: (data: Omit<Exercise, 'id'>) => void
  updateExercise: (exerciseId: string, data: Omit<Exercise, 'id'>) => void
  deleteExercise: (exerciseId: string) => DeletionResult
  createEquipment: (data: Omit<Equipment, 'id'>) => void
  updateEquipment: (equipmentId: string, data: Omit<Equipment, 'id'>) => void
  deleteEquipment: (equipmentId: string) => DeletionResult
}

/**
 * Altas, ediciones y bajas del catálogo, con sus reglas de integridad.
 *
 * Las reglas viven aquí y no en los componentes: no se borra un ejercicio que
 * alguna rutina prescribe, ni material con el que se ejecuta algún ejercicio.
 * Es el hook quien consulta las dos colecciones, porque la comprobación cruza
 * catálogo y rutinas y ningún componente debería tener que saber eso.
 *
 * Editar sí está permitido siempre: cambiarle el nombre a un ejercicio es
 * exactamente lo que se espera que se propague a todas las rutinas que lo
 * referencian. Ésa es la razón de referenciar por identificador en vez de
 * copiar.
 */
export function useCatalogEditor(): UseCatalogEditorResult {
  const catalog = useCatalogStore()
  const { routines } = useRoutines()

  const {
    exercises,
    createExercise,
    updateExercise,
    deleteExercise: removeExercise,
    createEquipment,
    updateEquipment,
    deleteEquipment: removeEquipment,
  } = catalog

  const deleteExercise = useCallback(
    (exerciseId: string): DeletionResult => {
      const enUso = findRoutinesUsingExercise(routines, exerciseId)

      if (enUso.length > 0) {
        // El verbo concuerda tambien, no solo el articulo.
        const sujeto = enUso.length === 1 ? 'Lo usa la rutina' : 'Lo usan las rutinas'
        return {
          deleted: false,
          reason: `${sujeto} ${describeNames(enUso.map((routine) => routine.title))}.`,
        }
      }

      removeExercise(exerciseId)
      return { deleted: true }
    },
    [routines, removeExercise]
  )

  const deleteEquipment = useCallback(
    (equipmentId: string): DeletionResult => {
      const enUso = findExercisesUsingEquipment(exercises, equipmentId)

      if (enUso.length > 0) {
        const sujeto = enUso.length === 1 ? 'Lo usa el ejercicio' : 'Lo usan los ejercicios'
        return {
          deleted: false,
          reason: `${sujeto} ${describeNames(enUso.map((exercise) => exercise.name))}.`,
        }
      }

      removeEquipment(equipmentId)
      return { deleted: true }
    },
    [exercises, removeEquipment]
  )

  return {
    createExercise,
    updateExercise,
    deleteExercise,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  }
}
