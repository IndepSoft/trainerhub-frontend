import type {
  Block,
  BlockMethod,
  Exercise,
  PrescribedExercise,
  Routine,
} from '../types/training.types'

/**
 * Cálculos derivados de una rutina. Funciones puras, sin React.
 */

/**
 * Segundos que se tarda en ejecutar una serie.
 *
 * Es una estimación declarada, no una medición: sin tempo prescrito se asume
 * un ritmo de unos tres segundos por repetición, que es lo habitual en trabajo
 * de fuerza controlado. Se deja explícito para que quien lo lea sepa que es un
 * supuesto y pueda cambiarlo.
 */
const SECONDS_PER_REP = 3

/**
 * Un rango de repeticiones se resuelve por su extremo superior.
 *
 * «8-10» estima con 10: es preferible que una sesión termine antes de lo
 * previsto a que se pase, porque el entrenador reserva el hueco en la agenda.
 */
function parseReps(reps: string): number {
  const numbers = reps.match(/\d+/g)
  if (!numbers) return 0
  return Math.max(...numbers.map(Number))
}

function estimateExerciseSeconds(exercise: PrescribedExercise): number {
  const workPerSet = parseReps(exercise.reps) * SECONDS_PER_REP
  // Los descansos son entre series, así que hay uno menos que series.
  const restTotal = exercise.restSeconds * Math.max(exercise.sets - 1, 0)
  return exercise.sets * workPerSet + restTotal
}

/**
 * Segundos de un bloque.
 *
 * En `simple` los ejercicios van uno tras otro. En superserie, triserie y
 * circuito se alternan sin descanso entre ellos, así que el descanso propio de
 * cada ejercicio NO se suma: sólo cuenta el del final de la ronda. Ignorar esa
 * diferencia inflaba la estimación de una superserie casi al doble.
 */
export function estimateBlockSeconds(block: Block): number {
  if (block.method === 'simple') {
    const work = block.exercises.reduce(
      (total, exercise) => total + estimateExerciseSeconds(exercise),
      0
    )
    return work + block.restAfterSeconds
  }

  const rounds = Math.max(...block.exercises.map((exercise) => exercise.sets), 0)
  const secondsPerRound = block.exercises.reduce(
    (total, exercise) => total + parseReps(exercise.reps) * SECONDS_PER_REP,
    0
  )
  const restBetweenRounds = block.restAfterSeconds * Math.max(rounds - 1, 0)
  return rounds * secondsPerRound + restBetweenRounds
}

/** Duración estimada de la rutina, en minutos. */
export function estimateRoutineMinutes(routine: Routine): number {
  const seconds = routine.blocks.reduce(
    (total, block) => total + estimateBlockSeconds(block),
    0
  )
  return Math.round(seconds / 60)
}

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
