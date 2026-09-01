import { useCallback, useMemo, useState } from 'react'
import {
  createBlockDraft,
  createEmptyRoutineDraft,
  createExerciseDraft,
  hasErrors,
  toRoutineData,
  toRoutineDraft,
  toRoutinePreview,
  validateRoutineDraft,
} from '../libs/routineDraft'
import type {
  BlockDraftChanges,
  PrescribedExerciseDraftChanges,
  RoutineDraft,
  RoutineDraftErrors,
} from '../types/routineDraft.types'
import { copyBlockToDraft } from '../libs/blockLibrary'
import type { Block, Routine, TrainingLevel } from '../types/training.types'
import type { NewRoutine } from '@/shared/domain/ports/RoutineRepository'

interface UseRoutineDraftResult {
  draft: RoutineDraft
  /** Vacío mientras no se ha intentado guardar. */
  errors: RoutineDraftErrors
  /** La rutina tal y como quedaría, para el resumen en vivo. */
  preview: Routine
  /** Falso cuando queda un solo bloque: una rutina sin bloques no es nada. */
  canRemoveBlock: boolean
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setLevel: (level: TrainingLevel) => void
  addBlock: () => void
  /** Añade una COPIA de un bloque guardado, con identificadores nuevos. */
  insertBlock: (block: Block) => void
  removeBlock: (blockId: string) => void
  updateBlock: (blockId: string, changes: BlockDraftChanges) => void
  addExercise: (blockId: string) => void
  removeExercise: (blockId: string, exerciseId: string) => void
  updateExercise: (
    blockId: string,
    exerciseId: string,
    changes: PrescribedExerciseDraftChanges
  ) => void
  /** Los datos listos para guardar, o `null` si el borrador no es válido. */
  submit: () => NewRoutine | null
}

/**
 * Estado del formulario de creación de rutinas.
 *
 * Toda la orquestación vive aquí y ni una decisión en los componentes: la
 * página y los editores de bloque reciben datos y manejadores, y su único
 * trabajo es pintar. Las reglas —qué es válido, cómo se convierte el borrador
 * en rutina, con qué valores nace un ejercicio— viven un piso más abajo, en
 * `libs/routineDraft.ts`, que es código puro y se puede probar sin montar React.
 *
 * LOS ERRORES NO APARECEN HASTA EL PRIMER INTENTO DE GUARDAR
 *
 * Un formulario que valida desde el primer render recibe al usuario con cuatro
 * mensajes en rojo por no haber escrito todavía nada, que es reprender a alguien
 * por acabar de llegar. A partir de ese primer intento sí se revalida en cada
 * pulsación, para que el aviso desaparezca en cuanto se corrige y no al
 * siguiente envío.
 */
export function useRoutineDraft(initial: Routine | null): UseRoutineDraftResult {
  const [draft, setDraft] = useState<RoutineDraft>(() =>
    initial === null ? createEmptyRoutineDraft() : toRoutineDraft(initial)
  )
  const [wasSubmitted, setWasSubmitted] = useState(false)

  const errors = useMemo(
    () => (wasSubmitted ? validateRoutineDraft(draft) : {}),
    [draft, wasSubmitted]
  )

  const preview = useMemo(() => toRoutinePreview(draft), [draft])

  const setTitle = useCallback((title: string) => {
    setDraft((current) => ({ ...current, title }))
  }, [])

  const setDescription = useCallback((description: string) => {
    setDraft((current) => ({ ...current, description }))
  }, [])

  const setLevel = useCallback((level: TrainingLevel) => {
    setDraft((current) => ({ ...current, level }))
  }, [])

  const addBlock = useCallback(() => {
    setDraft((current) => ({ ...current, blocks: [...current.blocks, createBlockDraft()] }))
  }, [])

  const insertBlock = useCallback((block: Block) => {
    // `copyBlockToDraft` genera identificadores nuevos: lo insertado no
    // comparte nada con la entrada de la biblioteca. Ver `SavedBlock`.
    setDraft((current) => ({ ...current, blocks: [...current.blocks, copyBlockToDraft(block)] }))
  }, [])

  const removeBlock = useCallback((blockId: string) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== blockId),
    }))
  }, [])

  const updateBlock = useCallback((blockId: string, changes: BlockDraftChanges) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId ? { ...block, ...changes } : block
      ),
    }))
  }, [])

  const addExercise = useCallback((blockId: string) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId
          ? { ...block, exercises: [...block.exercises, createExerciseDraft()] }
          : block
      ),
    }))
  }, [])

  const removeExercise = useCallback((blockId: string, exerciseId: string) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              exercises: block.exercises.filter((exercise) => exercise.id !== exerciseId),
            }
          : block
      ),
    }))
  }, [])

  const updateExercise = useCallback(
    (blockId: string, exerciseId: string, changes: PrescribedExerciseDraftChanges) => {
      setDraft((current) => ({
        ...current,
        blocks: current.blocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                exercises: block.exercises.map((exercise) =>
                  exercise.id === exerciseId ? { ...exercise, ...changes } : exercise
                ),
              }
            : block
        ),
      }))
    },
    []
  )

  /*
   * Devuelve los datos y NO guarda. Quien llama decide si es un alta o una
   * actualizacion, que es lo unico que distingue crear de editar: asi el mismo
   * formulario sirve para las dos cosas sin una condicion dentro. Mismo patron
   * que `useExerciseDraft`.
   */
  const submit = useCallback((): NewRoutine | null => {
    setWasSubmitted(true)

    const validation = validateRoutineDraft(draft)
    if (hasErrors(validation)) return null

    return toRoutineData(draft)
  }, [draft])

  return {
    draft,
    errors,
    preview,
    canRemoveBlock: draft.blocks.length > 1,
    setTitle,
    setDescription,
    setLevel,
    addBlock,
    insertBlock,
    removeBlock,
    updateBlock,
    addExercise,
    removeExercise,
    updateExercise,
    submit,
  }
}
