import type { Block, TrainingLevel } from '@/shared/domain/entities/routine'

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
 *
 * LA RUTINA Y LO QUE LA COMPONE YA NO VIVEN AQUÍ. Subieron a
 * `shared/domain/entities/routine.ts` cuando la agenda pasó a poder colgar una
 * rutina de una sesión: dos dominios la necesitan, y el criterio del proyecto
 * —escrito en `student.ts`— es que entonces sube. Se reexportan desde aquí para
 * que el dominio siga teniendo un solo sitio donde mirar sus tipos.
 */
export type {
  Block,
  BlockMethod,
  PrescribedExercise,
  Routine,
  TrainingLevel,
} from '@/shared/domain/entities/routine'

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
 * Un bloque guardado para reutilizarlo.
 *
 * SE COPIA AL INSERTAR, NO SE REFERENCIA. Es la decisión de fondo de la
 * biblioteca, y va al revés que el ejercicio: el ejercicio se referencia por
 * identificador —si cambia de nombre, cambia en todas partes—, y el bloque se
 * copia.
 *
 * El motivo es lo que pasaría si no. Si una rutina apuntara a la entrada de la
 * biblioteca, editarla cambiaría en silencio el programa que un estudiante está
 * haciendo esta semana. En una aplicación de entrenamiento eso no es un detalle
 * de consistencia: es tocarle la planificación a alguien sin que nadie se
 * entere. Duplicar bloques, en cambio, no cuesta nada.
 *
 * La regla que ordena las dos: **se referencia el vocabulario, se copia la
 * decisión.** Un ejercicio es vocabulario; un bloque es una decisión tomada en
 * un momento para una persona.
 *
 * Consecuencia buscada: borrar una entrada de la biblioteca no rompe ninguna
 * rutina, porque ninguna depende de ella. Por eso, y a diferencia del catálogo
 * de ejercicios, este borrado no necesita protección.
 */
export interface SavedBlock {
  id: string
  /** Se genera del contenido al guardar y se puede renombrar después. */
  name: string
  block: Block
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
