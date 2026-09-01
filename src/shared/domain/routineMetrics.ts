import type { Block, PrescribedExercise, Routine } from './entities/routine'

/**
 * Lo que se mide de una rutina: cuánto dura y cuánto trabajo tiene. Funciones
 * puras, sin React.
 *
 * Viven en `shared/domain` porque son propiedades DERIVADAS de una entidad
 * compartida y ya las necesitan tres dominios: `trainings` para pintarlas, el
 * generador que vuelca un plan —para reservar el hueco correcto— y la sesión en
 * vivo, que mide el avance en series. Dejarlas en `trainings` habría obligado a
 * los otros dos a importar de otro dominio.
 *
 * Nada de esto se almacena: un dato derivado que se guarda miente en cuanto
 * alguien edita un bloque y olvida actualizarlo.
 *
 * `countSetsByMuscleGroup` NO está aquí y es deliberado: necesita el catálogo de
 * ejercicios para resolver el grupo muscular, y ese catálogo sólo lo tiene
 * `trainings`.
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
