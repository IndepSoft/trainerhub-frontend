import { useCallback } from 'react'
import { container } from '@/app/container'
import { useCatalogStore } from '../stores/catalogStore'
import { useTrainingCatalog } from './useTrainingCatalog'
import { useRoutines } from './useRoutines'
import {
  describeNames,
  findExercisesUsingEquipment,
  findRoutinesUsingExercise,
} from '../libs/usage'
import type { Exercise } from '../types/training.types'
import type { Equipment } from '../types/catalog.types'
import type { DeletionResult } from '@/shared/domain/deletion'
import { useTranslation } from '@/shared/i18n/LanguageContext'

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
  const { plural } = useTranslation()
  const catalog = useCatalogStore()
  const { routines } = useRoutines()

  const { createEquipment, updateEquipment, deleteEquipment: removeEquipment } = catalog
  const { exercises } = useTrainingCatalog()

  const createExercise = useCallback(
    (data: Omit<Exercise, 'id'>) => {
      void container.exercises.create(data)
    },
    []
  )

  const updateExercise = useCallback((exerciseId: string, data: Omit<Exercise, 'id'>) => {
    void container.exercises.update(exerciseId, data)
  }, [])

  const deleteExercise = useCallback(
    (exerciseId: string): DeletionResult => {
      const enUso = findRoutinesUsingExercise(routines, exerciseId)

      if (enUso.length > 0) {
        // El verbo concuerda tambien, no solo el articulo.
        const sujeto = plural('deletion.usedByRoutine', 'deletion.usedByRoutines', enUso.length)
        return {
          deleted: false,
          reason: `${sujeto} ${describeNames(enUso.map((routine) => routine.title))}.`,
        }
      }

      void container.exercises.remove(exerciseId)
      return { deleted: true }
    },
    [routines, plural]
  )

  const deleteEquipment = useCallback(
    (equipmentId: string): DeletionResult => {
      const enUso = findExercisesUsingEquipment(exercises, equipmentId)

      if (enUso.length > 0) {
        const sujeto = plural('deletion.usedByExercise', 'deletion.usedByExercises', enUso.length)
        return {
          deleted: false,
          reason: `${sujeto} ${describeNames(enUso.map((exercise) => exercise.name))}.`,
        }
      }

      removeEquipment(equipmentId)
      return { deleted: true }
    },
    [exercises, removeEquipment, plural]
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
