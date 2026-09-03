import type {
  Block,
  BlockMethod,
  PrescribedExercise,
  Routine,
} from '@/shared/domain/entities/routine'

/**
 * Una serie concreta, en el orden en que toca hacerla. Es la unidad de la
 * sesión guiada.
 *
 * ES LA UNIDAD PORQUE ES LO QUE SE EJECUTA. La pantalla anterior enseñaba la
 * rutina entera y contaba series marcadas: servía de recordatorio, no de guía.
 * Aquí la sesión sabe en qué serie va, cuánto lleva de ella y qué viene después,
 * que es lo que hace falta con el teléfono en la mano entre serie y serie.
 */
export interface SetStep {
  /** Estable y único dentro de la rutina: `<prescripción>-<número de serie>`. */
  id: string
  blockId: string
  blockMethod: BlockMethod
  /** Posición del bloque en la rutina, 1 en adelante. Para situarse. */
  blockPosition: number
  prescribedId: string
  exerciseId: string
  /** Qué serie de las suyas es, 1 en adelante. */
  setNumber: number
  /** Cuántas tiene prescritas ese ejercicio. */
  totalSets: number
  /** Repeticiones prescritas, tal y como se escribieron: «8-10». */
  reps: string
  rir?: number
  tempo?: string
  notes?: string
  /**
   * Segundos de descanso DESPUÉS de esta serie. Cero cuando no toca descansar.
   *
   * En una superserie no se descansa entre ejercicios de la misma ronda: se
   * encadenan, y el descanso llega al cerrar la ronda. Ignorarlo convertiría una
   * superserie en dos ejercicios sueltos, que es justo lo que no es.
   */
  restSecondsAfter: number
}

/**
 * Repeticiones prescritas como número, resolviendo el rango por su tope.
 *
 * Por el tope y no por el suelo porque es lo que se pinta: un rango «8-10» ofrece
 * diez círculos y quien haga ocho marca ocho. Al revés faltarían dos donde
 * marcar.
 */
export function maxReps(reps: string): number {
  const numbers = reps.match(/\d+/g)
  if (numbers === null) return 0
  return Math.max(...numbers.map(Number))
}

function stepOf(
  block: Block,
  blockPosition: number,
  exercise: PrescribedExercise,
  setNumber: number,
  restSecondsAfter: number
): SetStep {
  return {
    id: `${exercise.id}-${setNumber}`,
    blockId: block.id,
    blockMethod: block.method,
    blockPosition,
    prescribedId: exercise.id,
    exerciseId: exercise.exerciseId,
    setNumber,
    totalSets: exercise.sets,
    reps: exercise.reps,
    rir: exercise.rir,
    tempo: exercise.tempo,
    notes: exercise.notes,
    restSecondsAfter,
  }
}

/**
 * Las series de un bloque `simple`: ejercicio a ejercicio, todas sus series
 * antes de pasar al siguiente.
 *
 * Entre series se descansa lo que diga la prescripción del ejercicio; al cerrar
 * el ejercicio entero, el descanso del bloque, que es el que separa un ejercicio
 * del siguiente.
 */
function stepsOfSimpleBlock(block: Block, blockPosition: number): SetStep[] {
  const steps: SetStep[] = []

  for (const exercise of block.exercises) {
    for (let setNumber = 1; setNumber <= exercise.sets; setNumber += 1) {
      const closesExercise = setNumber === exercise.sets
      const rest = closesExercise ? block.restAfterSeconds : exercise.restSeconds

      steps.push(stepOf(block, blockPosition, exercise, setNumber, rest))
    }
  }

  return steps
}

/**
 * Las series de una superserie, triserie o circuito: por RONDAS.
 *
 * Una ronda es una serie de cada ejercicio, encadenadas sin descanso; el
 * descanso llega al terminarla. Un ejercicio con menos series que el resto deja
 * de aparecer en las últimas rondas, en vez de bloquearlas.
 */
function stepsOfRoundBlock(block: Block, blockPosition: number): SetStep[] {
  const rounds = block.exercises.reduce((most, exercise) => Math.max(most, exercise.sets), 0)
  const steps: SetStep[] = []

  for (let round = 1; round <= rounds; round += 1) {
    const inRound = block.exercises.filter((exercise) => exercise.sets >= round)

    inRound.forEach((exercise, index) => {
      const closesRound = index === inRound.length - 1
      steps.push(
        stepOf(block, blockPosition, exercise, round, closesRound ? block.restAfterSeconds : 0)
      )
    })
  }

  return steps
}

/**
 * La rutina, aplanada a la lista ordenada de series que hay que hacer.
 *
 * Se calcula una vez y no cambia durante la sesión: lo que cambia es en cuál se
 * está. Un plan que se recalculara a cada paso podría reordenarse bajo los pies
 * de quien entrena.
 */
export function buildSetPlan(routine: Routine | null): SetStep[] {
  if (routine === null) return []

  return routine.blocks.flatMap((block, index) =>
    block.method === 'simple'
      ? stepsOfSimpleBlock(block, index + 1)
      : stepsOfRoundBlock(block, index + 1)
  )
}
