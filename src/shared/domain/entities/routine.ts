/**
 * La rutina, en términos de la aplicación.
 *
 * Vive en `shared/domain` desde que la agenda puede colgar una rutina de una
 * sesión, y no antes. El criterio es el mismo que declara `student.ts`: una
 * entidad sube a la capa compartida cuando la necesitan DOS dominios. Mientras
 * sólo la usaba `trainings` se quedó dentro de su dominio a propósito, y el
 * almacén que la servía dejaba escrito que éste era el día en que subiría.
 *
 * Sube lo que la rutina necesita para existir —el bloque, la prescripción, el
 * método y el nivel— y NADA más. `Exercise`, el catálogo, los planes y los
 * bloques guardados se quedan en `trainings`, porque la agenda no los necesita:
 * una prescripción referencia el ejercicio por identificador, así que el tipo
 * del ejercicio no viaja con ella.
 */

export type TrainingLevel = 'Principiante' | 'Intermedio' | 'Avanzado'

/**
 * Un ejercicio con su prescripción dentro de un bloque.
 *
 * `rir` es opcional porque no toda prescripción lo lleva: en trabajo técnico o
 * de movilidad, dejar repeticiones en reserva no significa nada. Que sea
 * opcional obliga a la vista a contemplar su ausencia en vez de pintar un cero
 * que se leería como «al fallo».
 */
export interface PrescribedExercise {
  id: string
  exerciseId: string
  sets: number
  /** Repeticiones por serie. Un rango se escribe «8-10». */
  reps: string
  /** Repeticiones en reserva. 0 es al fallo; ausente es «no aplica». */
  rir?: number
  restSeconds: number
  /** Cadencia en cuatro tiempos, «3-1-1-0». Opcional. */
  tempo?: string
  notes?: string
}

/**
 * Cómo se ejecutan los ejercicios de un bloque.
 *
 * `simple` es el caso de un solo ejercicio; existe para que la rutina contenga
 * SIEMPRE bloques y no una lista mezclada de dos tipos. Convertir un ejercicio
 * suelto en superserie pasa a ser cambiar este campo, y no reemplazar el nodo
 * por otro de otra forma.
 */
export type BlockMethod = 'simple' | 'superserie' | 'triserie' | 'circuito'

export interface Block {
  id: string
  method: BlockMethod
  exercises: PrescribedExercise[]
  /** Descanso al terminar la ronda completa del bloque. */
  restAfterSeconds: number
  notes?: string
}

/**
 * Una rutina es una SESIÓN de entrenamiento.
 *
 * No lleva duración almacenada: se calcula a partir de series, repeticiones,
 * tempo y descansos. Un dato derivado que se guarda es un dato que miente en
 * cuanto alguien edita un bloque y olvida actualizarlo, que es exactamente lo
 * que pasaba antes con `durationMinutes`.
 */
export interface Routine {
  id: string
  title: string
  description: string
  level: TrainingLevel
  blocks: Block[]
}
