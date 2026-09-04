import type { Exercise } from '../types/training.types'
import type { ExerciseDraft, ExerciseDraftErrors } from '../types/catalogDraft.types'
import type { Translate } from '@/shared/i18n/LanguageContext'

/**
 * Traducción y validación del borrador de ejercicio. Funciones puras.
 */

export function createEmptyExerciseDraft(): ExerciseDraft {
  return {
    name: '',
    description: '',
    equipmentId: '',
    movementPatternId: '',
    primaryMuscleGroupId: '',
    secondaryMuscleGroupIds: [],
    instructions: '',
  }
}

/** El borrador que corresponde a un ejercicio ya existente, para editarlo. */
export function toExerciseDraft(exercise: Exercise): ExerciseDraft {
  return {
    name: exercise.name,
    description: exercise.description ?? '',
    equipmentId: exercise.equipmentId,
    movementPatternId: exercise.movementPatternId,
    primaryMuscleGroupId: exercise.primaryMuscleGroupId,
    secondaryMuscleGroupIds: exercise.secondaryMuscleGroupIds,
    instructions: exercise.instructions.join('\n'),
  }
}

/**
 * Borrador a ejercicio, sin identificador: lo pone quien guarda.
 *
 * Las líneas en blanco del área de texto se descartan. Alguien que separa dos
 * pasos con una línea vacía no está pidiendo un paso vacío.
 */
export function toExerciseData(draft: ExerciseDraft): Omit<Exercise, 'id'> {
  const instructions = draft.instructions
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')

  const description = draft.description.trim()

  return {
    name: draft.name.trim(),
    description: description === '' ? undefined : description,
    equipmentId: draft.equipmentId,
    movementPatternId: draft.movementPatternId,
    primaryMuscleGroupId: draft.primaryMuscleGroupId,
    // El primario no puede colarse tambien como secundario: contaria dos veces
    // al repartir volumen, y en la ficha se leeria repetido.
    secondaryMuscleGroupIds: draft.secondaryMuscleGroupIds.filter(
      (muscleGroupId) => muscleGroupId !== draft.primaryMuscleGroupId
    ),
    instructions,
  }
}

/**
 * Validación.
 *
 * Los cuatro obligatorios son los que hacen categorizable al ejercicio. Sin
 * grupo muscular primario no se puede contar volumen; sin patrón de movimiento
 * no se puede equilibrar una sesión; sin equipamiento no se sabe con qué se
 * ejecuta. La descripción y las instrucciones son texto de ayuda y no lo son.
 */
/* Traducir llega por parametro: son funciones puras, no componentes. */
export function validateExerciseDraft(draft: ExerciseDraft, t: Translate): ExerciseDraftErrors {
  const errors: ExerciseDraftErrors = {}

  if (draft.name.trim() === '') {
    errors.name = t('exercise.needsName')
  }

  if (draft.equipmentId === '') {
    errors.equipmentId = t('exercise.needsEquipment')
  }

  if (draft.movementPatternId === '') {
    errors.movementPatternId = t('exercise.needsPattern')
  }

  if (draft.primaryMuscleGroupId === '') {
    errors.primaryMuscleGroupId = t('exercise.needsMuscle')
  }

  return errors
}

export function hasExerciseDraftErrors(errors: ExerciseDraftErrors): boolean {
  return Object.keys(errors).length > 0
}
