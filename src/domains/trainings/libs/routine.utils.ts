import type {
  BlockMethod,
  Exercise,
  PrescribedExercise,
  Routine,
} from '../types/training.types'

/**
 * Cálculos derivados de una rutina. Funciones puras, sin React.
 *
 * LA ESTIMACIÓN DE DURACIÓN YA NO VIVE AQUÍ. Subió a
 * `shared/domain/routineDuration.ts` cuando el volcado de un plan a la agenda
 * pasó a necesitarla desde `students`: es una propiedad derivada de una entidad
 * compartida. Se reexporta para no cambiar a sus consumidores.
 */
export { estimateBlockSeconds, estimateRoutineMinutes } from '@/shared/domain/routineDuration'

/** Todos los ejercicios prescritos, en el orden en que se ejecutan. */
export function flattenPrescribedExercises(routine: Routine): PrescribedExercise[] {
  return routine.blocks.flatMap((block) => block.exercises)
}

export function countExercises(routine: Routine): number {
  return flattenPrescribedExercises(routine).length
}

/** Series totales de la sesión. Es la medida de volumen que se programa. */
export function countTotalSets(routine: Routine): number {
  return flattenPrescribedExercises(routine).reduce(
    (total, exercise) => total + exercise.sets,
    0
  )
}

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

/** Etiqueta del método, para no repetir el mapa en cada vista. */
export const BLOCK_METHOD_LABELS: Record<BlockMethod, string> = {
  simple: 'Serie simple',
  superserie: 'Superserie',
  triserie: 'Triserie',
  circuito: 'Circuito',
}

/**
 * Prescripción en una línea: «4 × 8-10 · RIR 2».
 *
 * El RIR se omite cuando no está prescrito, en vez de mostrar «RIR 0», que se
 * leería como «al fallo» y es lo contrario de «no aplica».
 */
export function formatPrescription(exercise: PrescribedExercise): string {
  const base = `${exercise.sets} × ${exercise.reps}`
  return exercise.rir === undefined ? base : `${base} · RIR ${exercise.rir}`
}

/** `90` → `1:30`. Para descansos, donde el minutero se lee mejor que los segundos. */
export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder === 0 ? `${minutes} min` : `${minutes}:${String(remainder).padStart(2, '0')}`
}
