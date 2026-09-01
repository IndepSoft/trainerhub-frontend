import { create } from 'zustand'
import { EQUIPMENT } from '../data/catalog.mock'
import type { Equipment } from '../types/catalog.types'

interface CatalogState {
  equipment: Equipment[]
  createEquipment: (data: Omit<Equipment, 'id'>) => Equipment
  updateEquipment: (equipmentId: string, data: Omit<Equipment, 'id'>) => void
  deleteEquipment: (equipmentId: string) => void
}

/**
 * Equipamiento editable por el entrenador.
 *
 * LOS EJERCICIOS YA NO ESTÁN AQUÍ: subieron a `ExerciseRepository` cuando la
 * sesión en vivo pasó a necesitar sus nombres. El equipamiento se queda porque
 * sólo lo mira `trainings`, y el criterio es el mismo de siempre: sube lo que
 * cruza, y sólo cuando cruza.
 *
 * Las otras cuatro tablas —grupos musculares, patrones, objetivos, divisiones—
 * no están ni aquí ni en un puerto: son vocabulario del sistema y no se editan.
 *
 * TODO: los datos viven sólo en memoria. Al recargar vuelve la semilla.
 */
export const useCatalogStore = create<CatalogState>((set) => ({
  equipment: EQUIPMENT,

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
