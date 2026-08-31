import { useCallback, useMemo, useState } from 'react'
import { useRoutinesStore } from '../stores/routinesStore'
import {
  createBlockDraft,
  createEmptyRoutineDraft,
  createExerciseDraft,
  hasErrors,
  toRoutineData,
  toRoutinePreview,
  validateRoutineDraft,
} from '../libs/routineDraft'
import type {
  BlockDraftChanges,
  PrescribedExerciseDraftChanges,
  RoutineDraft,
  RoutineDraftErrors,
} from '../types/routineDraft.types'
import type { Routine, TrainingLevel } from '../types/training.types'

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
  removeBlock: (blockId: string) => void
  updateBlock: (blockId: string, changes: BlockDraftChanges) => void
  addExercise: (blockId: string) => void
  removeExercise: (blockId: string, exerciseId: string) => void
  updateExercise: (
    blockId: string,
    exerciseId: string,
    changes: PrescribedExerciseDraftChanges
  ) => void
  /** Guarda si el borrador es válido. Devuelve `null` cuando no lo es. */
  submit: () => Routine | null
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
export function useRoutineDraft(): UseRoutineDraftResult {
  const createRoutine = useRoutinesStore((state) => state.createRoutine)

  const [draft, setDraft] = useState<RoutineDraft>(createEmptyRoutineDraft)
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

  const submit = useCallback((): Routine | null => {
    setWasSubmitted(true)

    const validation = validateRoutineDraft(draft)
    if (hasErrors(validation)) return null

    return createRoutine(toRoutineData(draft))
  }, [draft, createRoutine])

  return {
    draft,
    errors,
    preview,
    canRemoveBlock: draft.blocks.length > 1,
    setTitle,
    setDescription,
    setLevel,
    addBlock,
    removeBlock,
    updateBlock,
    addExercise,
    removeExercise,
    updateExercise,
    submit,
  }
}
