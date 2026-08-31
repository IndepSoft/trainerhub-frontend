import { create } from 'zustand'
import type { Block, SavedBlock } from '../types/training.types'

interface BlockLibraryState {
  savedBlocks: SavedBlock[]
  saveBlock: (name: string, block: Block) => SavedBlock
  renameBlock: (savedBlockId: string, name: string) => void
  deleteBlock: (savedBlockId: string) => void
}

/**
 * Bloques que el entrenador guarda para volver a usarlos.
 *
 * Arranca VACÍA, sin semilla. Los otros dos almacenes parten de datos simulados
 * porque representan cosas que existirían ya —rutinas de ejemplo, el catálogo
 * base—; una biblioteca, en cambio, es por definición lo que cada uno ha ido
 * apartando. Precargarla con ejemplos haría creer que son suyos.
 *
 * No tiene reglas de integridad, y eso es una consecuencia buscada del diseño:
 * como las rutinas guardan COPIAS y no referencias, borrar una entrada no rompe
 * nada. El razonamiento completo está en `SavedBlock`.
 *
 * TODO: vive sólo en memoria, igual que los otros dos almacenes.
 */
export const useBlockLibraryStore = create<BlockLibraryState>((set) => ({
  savedBlocks: [],

  saveBlock: (name, block) => {
    const saved: SavedBlock = { id: crypto.randomUUID(), name, block }
    set((state) => ({ savedBlocks: [saved, ...state.savedBlocks] }))
    return saved
  },

  renameBlock: (savedBlockId, name) => {
    set((state) => ({
      savedBlocks: state.savedBlocks.map((saved) =>
        saved.id === savedBlockId ? { ...saved, name } : saved
      ),
    }))
  },

  deleteBlock: (savedBlockId) => {
    set((state) => ({
      savedBlocks: state.savedBlocks.filter((saved) => saved.id !== savedBlockId),
    }))
  },
}))
