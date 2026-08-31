import { useCallback } from 'react'
import { useBlockLibraryStore } from '../stores/blockLibraryStore'
import { useTrainingCatalog } from './useTrainingCatalog'
import { describeBlock } from '../libs/blockLibrary'
import { toBlock } from '../libs/routineDraft'
import type { BlockDraft } from '../types/routineDraft.types'
import type { SavedBlock } from '../types/training.types'

interface UseBlockLibraryResult {
  savedBlocks: SavedBlock[]
  /** Guarda un bloque del formulario, nombrándolo por su contenido. */
  saveFromDraft: (draft: BlockDraft) => SavedBlock
  renameBlock: (savedBlockId: string, name: string) => void
  deleteBlock: (savedBlockId: string) => void
}

/**
 * La biblioteca de bloques.
 *
 * `saveFromDraft` recibe el bloque tal y como está en el formulario y se ocupa
 * de las dos traducciones: borrador a entidad, y contenido a nombre. La página
 * no tiene que saber ninguna de las dos.
 */
export function useBlockLibrary(): UseBlockLibraryResult {
  const savedBlocks = useBlockLibraryStore((state) => state.savedBlocks)
  const saveBlock = useBlockLibraryStore((state) => state.saveBlock)
  const renameBlock = useBlockLibraryStore((state) => state.renameBlock)
  const deleteBlock = useBlockLibraryStore((state) => state.deleteBlock)
  const { exercisesById } = useTrainingCatalog()

  const saveFromDraft = useCallback(
    (draft: BlockDraft): SavedBlock => {
      const block = toBlock(draft)
      return saveBlock(describeBlock(block, exercisesById), block)
    },
    [saveBlock, exercisesById]
  )

  return { savedBlocks, saveFromDraft, renameBlock, deleteBlock }
}
