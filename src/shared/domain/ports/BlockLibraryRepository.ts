import type { Block } from '../entities/routine'
import type { SavedBlock } from '../entities/savedBlock'

/**
 * Puerto de la biblioteca de bloques.
 *
 * NO EXISTÍA: la biblioteca era un almacén de `zustand` que se vaciaba al
 * recargar. Es el segundo de los tres almacenes que el plan encontró fuera de
 * los puertos, y el que más duele: guardar un bloque es guardar una decisión
 * pensada, y perderla al cerrar la pestaña es perder trabajo.
 *
 * Acotado al crew activo. La biblioteca es del equipo técnico —quien la usa es
 * quien escribe rutinas—, no de cada entrenador por separado.
 */
export interface BlockLibraryRepository {
  findAll(): Promise<SavedBlock[]>
  save(name: string, block: Block): Promise<SavedBlock>
  rename(savedBlockId: string, name: string): Promise<void>
  remove(savedBlockId: string): Promise<void>
  onChange(listener: () => void): () => void
}
