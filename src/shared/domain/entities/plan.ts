import type { TrainingLevel } from './routine'

/**
 * El plan de entrenamiento, en términos de la aplicación.
 *
 * Vive en `shared/domain` desde que la ficha de un estudiante puede tener un
 * plan asignado: lo necesitan `trainings`, que los compone, y `students`, que
 * los asigna. Tercera vez que se aplica el mismo criterio, escrito en
 * `student.ts`: una entidad sube cuando la necesitan DOS dominios.
 *
 * OJO CON LO QUE **NO** TIENE. No tiene dueño ni fechas reales: `PlanDay` dice
 * «lunes», no «lunes 8 de septiembre». Un plan es un patrón semanal, no un
 * compromiso en el calendario. Quién lo sigue y desde cuándo lo dice la
 * asignación; a qué hora, el volcado a la agenda.
 */

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
