import type { Exercise, Routine } from '../types/training.types'
import { flattenPrescribedExercises } from './routine.utils'

/**
 * Quién está usando una entrada del catálogo. Funciones puras, sin React.
 *
 * Existen porque una rutina guarda `exerciseId`, no una copia del ejercicio.
 * Esa referencia es lo correcto —si «Press de banca con barra» cambia de
 * nombre, cambia en todas partes— pero tiene la contrapartida de siempre:
 * borrar la entrada deja la referencia colgando. Las vistas degradan bien
 * («Ejercicio» en vez del nombre), y aun así romper una rutina en silencio no
 * es aceptable, así que el borrado se bloquea y se dice quién lo impide.
 */

/** Rutinas que prescriben este ejercicio, sin repetir. */
export function findRoutinesUsingExercise(routines: Routine[], exerciseId: string): Routine[] {
  return routines.filter((routine) =>
    flattenPrescribedExercises(routine).some(
      (prescribed) => prescribed.exerciseId === exerciseId
    )
  )
}

/** Ejercicios que se ejecutan con este material. */
export function findExercisesUsingEquipment(
  exercises: Exercise[],
  equipmentId: string
): Exercise[] {
  return exercises.filter((exercise) => exercise.equipmentId === equipmentId)
}

/**
 * Enumera nombres para un aviso, sin convertirlo en un muro de texto.
 *
 * «Full body, Empuje y 3 más» dice lo mismo que la lista entera y cabe en una
 * línea. El límite es de presentación, pero vive aquí para que los dos avisos
 * —ejercicio y equipamiento— lo digan igual.
 */
export function describeNames(names: string[], visibleCount = 2): string {
  if (names.length <= visibleCount) return names.join(', ')

  const visible = names.slice(0, visibleCount).join(', ')
  const remaining = names.length - visibleCount
  return `${visible} y ${remaining} más`
}
