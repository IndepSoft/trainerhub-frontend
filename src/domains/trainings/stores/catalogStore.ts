import { create } from 'zustand'
import { EQUIPMENT } from '../data/catalog.mock'
import { exercisesMock } from '../data/exercises.mock'
import type { Exercise } from '../types/training.types'
import type { Equipment } from '../types/catalog.types'

interface CatalogState {
  exercises: Exercise[]
  equipment: Equipment[]
  createExercise: (data: Omit<Exercise, 'id'>) => Exercise
  updateExercise: (exerciseId: string, data: Omit<Exercise, 'id'>) => void
  deleteExercise: (exerciseId: string) => void
  createEquipment: (data: Omit<Equipment, 'id'>) => Equipment
  updateEquipment: (equipmentId: string, data: Omit<Equipment, 'id'>) => void
  deleteEquipment: (equipmentId: string) => void
}

/**
 * Catálogo editable: ejercicios y equipamiento.
 *
 * POR QUÉ SÓLO ESTAS DOS TABLAS
 *
 * De los seis catálogos, éstos son los que pertenecen al entrenador: cada
 * gimnasio tiene su material y su forma de nombrar los ejercicios. Los otros
 * cuatro —grupos musculares, patrones de movimiento, objetivos y divisiones—
 * son vocabulario, y abrirlos a edición libre **rompe el filtrado**: en cuanto
 * un entrenador escribe «Pecho» y otro «Pectoral», contar series por grupo
 * muscular deja de significar nada. Se sirven en solo lectura desde
 * `catalog.mock.ts`.
 *
 * Mismo razonamiento que en `routinesStore` sobre por qué esto no es un puerto
 * en `shared/domain/ports`: la entidad no cruza a un segundo dominio todavía.
 *
 * TODO: los datos viven sólo en memoria. Al recargar vuelve la semilla.
 */
export const useCatalogStore = create<CatalogState>((set) => ({
  exercises: exercisesMock,
  equipment: EQUIPMENT,

  createExercise: (data) => {
    const exercise: Exercise = { id: crypto.randomUUID(), ...data }
    set((state) => ({ exercises: [exercise, ...state.exercises] }))
    return exercise
  },

  updateExercise: (exerciseId, data) => {
    set((state) => ({
      exercises: state.exercises.map((exercise) =>
        exercise.id === exerciseId ? { id: exerciseId, ...data } : exercise
      ),
    }))
  },

  deleteExercise: (exerciseId) => {
    set((state) => ({
      exercises: state.exercises.filter((exercise) => exercise.id !== exerciseId),
    }))
  },

  createEquipment: (data) => {
    const item: Equipment = { id: crypto.randomUUID(), ...data }
    set((state) => ({ equipment: [item, ...state.equipment] }))
    return item
  },

  updateEquipment: (equipmentId, data) => {
    set((state) => ({
      equipment: state.equipment.map((item) =>
        item.id === equipmentId ? { id: equipmentId, ...data } : item
      ),
    }))
  },

  deleteEquipment: (equipmentId) => {
    set((state) => ({ equipment: state.equipment.filter((item) => item.id !== equipmentId) }))
  },
}))
