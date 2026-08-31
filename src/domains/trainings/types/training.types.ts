/**
 * Entidades del dominio de entrenamientos.
 *
 * La jerarquía sigue la de la literatura de fuerza:
 *
 *   Ejercicio  →  Bloque  →  Rutina (sesión)  →  Plan (mesociclo)
 *                                                  └─ Semana (microciclo)
 *
 * Los catálogos se referencian por identificador, nunca se copian: si mañana
 * «Polea» cambia de nombre, cambia en un sitio.
 */

export type TrainingLevel = 'Principiante' | 'Intermedio' | 'Avanzado'

/**
 * Un ejercicio del catálogo.
 *
 * El equipamiento forma parte del ejercicio, no del bloque: «press de banca con
 * barra» y «press de banca con mancuernas» son entradas distintas —distinta
 * estabilización, distinta progresión de carga—, y si el material colgara del
 * bloque no podría existir una superserie de barra más polea.
 */
export interface Exercise {
  id: string
  name: string
  description?: string
  equipmentId: string
  movementPatternId: string
  /** El que hace el trabajo principal. Uno solo, a propósito. */
  primaryMuscleGroupId: string
  /** Los que acompañan. Sirven para categorizar y para repartir el volumen. */
  secondaryMuscleGroupIds: string[]
  instructions: string[]
}

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

/** Un día del microciclo. Sin rutina asignada es descanso. */
export interface PlanDay {
  /** 1 = lunes … 7 = domingo. */
  dayOfWeek: number
  routineId: string | null
}

/** Una semana del plan, o microciclo. */
export interface PlanWeek {
  /** 1 = primera semana del mesociclo. */
  number: number
  days: PlanDay[]
  /** Semana de descarga: menos volumen para asimilar lo acumulado. */
  isDeload: boolean
}

/**
 * NO HAY MARCA DE «PLANTILLA», ni aquí ni en la rutina.
 *
 * La hubo, y no gobernaba nada: sólo repartía la lista en dos pestañas y pintaba
 * un rótulo distinto. El argumento para quitarla es que hoy **ninguna rutina y
 * ningún plan se asignan a nadie** —ni `Routine` ni `TrainingPlan` tienen un
 * campo que apunte a un estudiante—, así que todos son igualmente plantillas y
 * la distinción no distinguía. Cuando exista la asignación, «plantilla» será
 * derivable —lo que nadie usa— o se sustituirá por algo más útil, como carpetas
 * o favoritos; en ninguno de los dos casos hace falta un booleano guardado.
 */

/**
 * Un plan de entrenamiento es un MESOCICLO: varias semanas hacia un objetivo.
 *
 * La frecuencia semanal es un número y no un catálogo: dice cuántas veces se
 * entrena cada músculo por microciclo, y se deriva de la división elegida, pero
 * el entrenador puede apartarse de ella.
 */
export interface TrainingPlan {
  id: string
  title: string
  description: string
  objectiveId: string
  splitId: string
  weeklyFrequency: number
  level: TrainingLevel
  weeks: PlanWeek[]
}
