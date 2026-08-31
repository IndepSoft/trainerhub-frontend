import { useCallback, useMemo, useState } from 'react'
import {
  createEmptyExerciseDraft,
  hasExerciseDraftErrors,
  toExerciseData,
  toExerciseDraft,
  validateExerciseDraft,
} from '../libs/catalogDraft'
import type { Exercise } from '../types/training.types'
import type { ExerciseDraft, ExerciseDraftErrors } from '../types/catalogDraft.types'

type ExerciseDraftChanges = Partial<Omit<ExerciseDraft, 'secondaryMuscleGroupIds'>>

interface UseExerciseDraftResult {
  draft: ExerciseDraft
  /** Vacío mientras no se ha intentado guardar. */
  errors: ExerciseDraftErrors
  update: (changes: ExerciseDraftChanges) => void
  toggleSecondaryMuscleGroup: (muscleGroupId: string) => void
  /** Devuelve el ejercicio listo para guardar, o `null` si no es válido. */
  submit: () => Omit<Exercise, 'id'> | null
}

/**
 * Estado del formulario de ejercicio, para alta y para edición.
 *
 * La distinción entre crear y editar no vive aquí: recibe el ejercicio de
 * partida o nada, y devuelve datos sin identificador. Quién los guarda —y si es
 * un alta o una actualización— es decisión de quien llama. Así el mismo
 * formulario sirve para las dos cosas sin una sola condición dentro.
 *
 * Los errores no aparecen hasta el primer intento de guardar, por el mismo
 * motivo que en `useRoutineDraft`.
 */
export function useExerciseDraft(initial: Exercise | null): UseExerciseDraftResult {
  const [draft, setDraft] = useState<ExerciseDraft>(() =>
    initial === null ? createEmptyExerciseDraft() : toExerciseDraft(initial)
  )
  const [wasSubmitted, setWasSubmitted] = useState(false)

  const errors = useMemo(
    () => (wasSubmitted ? validateExerciseDraft(draft) : {}),
    [draft, wasSubmitted]
  )

  const update = useCallback((changes: ExerciseDraftChanges) => {
    setDraft((current) => ({ ...current, ...changes }))
  }, [])

  const toggleSecondaryMuscleGroup = useCallback((muscleGroupId: string) => {
    setDraft((current) => {
      const yaEsta = current.secondaryMuscleGroupIds.includes(muscleGroupId)
      return {
        ...current,
        secondaryMuscleGroupIds: yaEsta
          ? current.secondaryMuscleGroupIds.filter((candidate) => candidate !== muscleGroupId)
          : [...current.secondaryMuscleGroupIds, muscleGroupId],
      }
    })
  }, [])

  const submit = useCallback((): Omit<Exercise, 'id'> | null => {
    setWasSubmitted(true)

    const validation = validateExerciseDraft(draft)
    if (hasExerciseDraftErrors(validation)) return null

    return toExerciseData(draft)
  }, [draft])

  return { draft, errors, update, toggleSecondaryMuscleGroup, submit }
}
