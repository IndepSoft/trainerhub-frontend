import type { CatalogRepository } from '@/shared/domain/ports/CatalogRepository'
import type { Equipment, TrainingCatalog } from '@/shared/domain/entities/catalog'
import {
  EQUIPMENT,
  MOVEMENT_PATTERNS,
  MUSCLE_GROUPS,
  TRAINING_OBJECTIVES,
  TRAINING_SPLITS,
} from './catalogSeed'

/**
 * Catalogo simulado.
 *
 * SUSTITUYE AL ALMACEN DE `zustand` que vivia en `trainings/stores`: el mismo
 * comportamiento -el material que se da de alta vive en memoria y vuelve a la
 * semilla al recargar-, pero detras de un puerto, que es lo que hacia falta
 * para que existiera un adaptador real.
 *
 * TODO: los datos viven solo en memoria. Al recargar vuelve la semilla.
 */
export class FakeCatalogRepository implements CatalogRepository {
  private equipment: Equipment[] = EQUIPMENT
  private readonly listeners = new Set<() => void>()

  async findAll(): Promise<TrainingCatalog> {
    return {
      muscleGroups: MUSCLE_GROUPS,
      movementPatterns: MOVEMENT_PATTERNS,
      equipment: this.equipment,
      objectives: TRAINING_OBJECTIVES,
      splits: TRAINING_SPLITS,
    }
  }

  async createEquipment(data: Omit<Equipment, 'id'>): Promise<Equipment> {
    const item: Equipment = { id: crypto.randomUUID(), ...data }
    this.equipment = [item, ...this.equipment]
    this.notify()
    return item
  }

  async updateEquipment(equipmentId: string, data: Omit<Equipment, 'id'>): Promise<void> {
    this.equipment = this.equipment.map((item) =>
      item.id === equipmentId ? { id: equipmentId, ...data } : item
    )
    this.notify()
  }

  async removeEquipment(equipmentId: string): Promise<void> {
    this.equipment = this.equipment.filter((item) => item.id !== equipmentId)
    this.notify()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
