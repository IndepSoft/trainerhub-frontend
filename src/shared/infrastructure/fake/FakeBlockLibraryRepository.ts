import type { BlockLibraryRepository } from '@/shared/domain/ports/BlockLibraryRepository'
import type { Block } from '@/shared/domain/entities/routine'
import type { SavedBlock } from '@/shared/domain/entities/savedBlock'

/**
 * Biblioteca de bloques simulada.
 *
 * SUSTITUYE AL ALMACEN DE `zustand` de `trainings/stores`, con el mismo
 * comportamiento y detras de un puerto. Nace vacia: la biblioteca es lo que
 * cada equipo va guardando, no vocabulario de sistema.
 *
 * TODO: los datos viven solo en memoria. Al recargar se pierden.
 */
export class FakeBlockLibraryRepository implements BlockLibraryRepository {
  private savedBlocks: SavedBlock[] = []
  private readonly listeners = new Set<() => void>()

  async findAll(): Promise<SavedBlock[]> {
    return this.savedBlocks
  }

  async save(name: string, block: Block): Promise<SavedBlock> {
    const saved: SavedBlock = { id: crypto.randomUUID(), name, block }
    this.savedBlocks = [saved, ...this.savedBlocks]
    this.notify()
    return saved
  }

  async rename(savedBlockId: string, name: string): Promise<void> {
    this.savedBlocks = this.savedBlocks.map((saved) =>
      saved.id === savedBlockId ? { ...saved, name } : saved
    )
    this.notify()
  }

  async remove(savedBlockId: string): Promise<void> {
    this.savedBlocks = this.savedBlocks.filter((saved) => saved.id !== savedBlockId)
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
