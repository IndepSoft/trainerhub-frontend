import type { Block } from '@/shared/domain/entities/routine'

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
 * EL PLAN TAMPOCO VIVE YA AQUÍ. Subió a `shared/domain/entities/plan.ts` cuando
 * la ficha del estudiante paso a poder tenerlo asignado. Se reexporta para que
 * el dominio siga teniendo un solo sitio donde mirar sus tipos.
 */
export type { PlanDay, PlanWeek, TrainingPlan } from '@/shared/domain/entities/plan'

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

