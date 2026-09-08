import type { Equipment, TrainingCatalog } from '../entities/catalog'

/**
 * Puerto del catálogo del entrenamiento.
 *
 * NO EXISTÍA. El material vivía en un almacén de `zustand` sin adaptador: lo que
 * un entrenador daba de alta —«Prensa de piernas»— se perdía al recargar, y
 * ningún hook podía pedirlo por contrato. Es uno de los tres almacenes que el
 * plan encontró fuera de los puertos.
 *
 * Una sola lectura para las cinco tablas: se resuelven a la vez —un plan
 * referencia objetivo y división; un ejercicio, patrón, músculo y material— y
 * cinco viajes para pintar una pantalla serían cinco latencias en fila.
 *
 * Sólo el material se escribe. Las otras cuatro tablas son vocabulario del
 * sistema y no tienen operación de escritura aquí a propósito: que no exista es
 * la garantía de que nadie las edita desde la aplicación.
 *
 * Acotado al crew activo para el material del equipo; el de sistema llega igual
 * para todo el mundo. Ver `CrewScope`.
 */
export interface CatalogRepository {
  findAll(): Promise<TrainingCatalog>
  createEquipment(data: Omit<Equipment, 'id'>): Promise<Equipment>
  updateEquipment(equipmentId: string, data: Omit<Equipment, 'id'>): Promise<void>
  removeEquipment(equipmentId: string): Promise<void>
  onChange(listener: () => void): () => void
}
