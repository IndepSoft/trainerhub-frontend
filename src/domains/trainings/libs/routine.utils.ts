import type { Exercise, Routine } from '../types/training.types'

/**
 * Cálculos derivados de una rutina. Funciones puras, sin React.
 *
 * LAS MEDIDAS DE LA RUTINA YA NO VIVEN AQUÍ. Subieron a
 * `shared/domain/routineMetrics.ts` en cuanto las necesitaron otros dominios:
 * el volcado de un plan, desde `students`, y la sesión en vivo, que mide el
 * avance en series. Se reexportan para no cambiar a sus consumidores.
 *
 * Y LOS FORMATOS TAMPOCO. `formatPrescription` y `formatRest` estan en
 * `shared/lib/routineFormat.ts`, por lo mismo: los usa tambien la sesion en
 * vivo. Se reexportan desde aqui. El rotulo del metodo se fue mas lejos: es
 * texto, y vive en `shared/i18n/domainLabels.ts`.
 *
 * Aquí se queda sólo lo que necesita el catálogo de ejercicios.
 */
import { flattenPrescribedExercises } from '@/shared/domain/routineMetrics'

export { formatPrescription, formatRest } from '@/shared/lib/routineFormat'

export {
  countExercises,
  countTotalSets,
  estimateBlockSeconds,
  estimateRoutineMinutes,
  flattenPrescribedExercises,
} from '@/shared/domain/routineMetrics'

/**
 * Series por grupo muscular primario.
 *
 * Sólo el primario: repartir el volumen entre primario y secundarios exige
 * decidir un coeficiente —¿medio punto por secundario?— y no hay consenso. Con
 * el primario, la cifra es discutible pero al menos es reproducible.
 */
export function countSetsByMuscleGroup(
  routine: Routine,
  exercisesById: Map<string, Exercise>
): Map<string, number> {
  const counts = new Map<string, number>()

  for (const prescribed of flattenPrescribedExercises(routine)) {
    const exercise = exercisesById.get(prescribed.exerciseId)
    if (!exercise) continue
    const current = counts.get(exercise.primaryMuscleGroupId) ?? 0
    counts.set(exercise.primaryMuscleGroupId, current + prescribed.sets)
  }

  return counts
}
