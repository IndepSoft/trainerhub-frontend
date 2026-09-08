import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { useTrainingCatalog } from './useTrainingCatalog'
import { describeBlock } from '../libs/blockLibrary'
import { toBlock } from '../libs/routineDraft'
import type { BlockDraft } from '../types/routineDraft.types'
import type { SavedBlock } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface UseBlockLibraryResult {
  savedBlocks: SavedBlock[]
  /** Guarda un bloque del formulario, nombrándolo por su contenido. */
  saveFromDraft: (draft: BlockDraft) => Promise<SavedBlock>
  renameBlock: (savedBlockId: string, name: string) => void
  deleteBlock: (savedBlockId: string) => void
}

/**
 * La biblioteca de bloques.
 *
 * VA POR EL PUERTO desde que existe: vivía en un almacén de `zustand` y se
 * vaciaba al recargar, que para algo que guarda decisiones pensadas era perder
 * trabajo. Ahora `container.blockLibrary` la sirve, y en la simulación se
 * comporta igual que antes.
 *
 * `saveFromDraft` recibe el bloque tal y como está en el formulario y se ocupa
 * de las dos traducciones: borrador a entidad, y contenido a nombre. La página
 * no tiene que saber ninguna de las dos.
 */
export function useBlockLibrary(): UseBlockLibraryResult {
  const { t } = useTranslation()
  const [savedBlocks, setSavedBlocks] = useState<SavedBlock[]>([])
  const { exercisesById } = useTrainingCatalog()

  useEffect(() => {
    let active = true

    const load = () => {
      container.blockLibrary.findAll().then((result) => {
        if (active) setSavedBlocks(result)
      })
    }

    load()
    const unsubscribe = container.blockLibrary.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const saveFromDraft = useCallback(
    (draft: BlockDraft): Promise<SavedBlock> => {
      const block = toBlock(draft)
      return container.blockLibrary.save(describeBlock(block, exercisesById, t), block)
    },
    [exercisesById, t]
  )

  const renameBlock = useCallback((savedBlockId: string, name: string) => {
    void container.blockLibrary.rename(savedBlockId, name)
  }, [])

  const deleteBlock = useCallback((savedBlockId: string) => {
    void container.blockLibrary.remove(savedBlockId)
  }, [])

  return { savedBlocks, saveFromDraft, renameBlock, deleteBlock }
}
