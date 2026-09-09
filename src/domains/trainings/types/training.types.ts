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
 * EL EJERCICIO TAMPOCO. Subió a `shared/domain/entities/exercise.ts` cuando la
 * sesión en vivo paso a necesitar su nombre para pintar los bloques.
 */
export type { Exercise } from '@/shared/domain/entities/exercise'

/**
 * EL BLOQUE GUARDADO TAMPOCO VIVE YA AQUÍ. Subió a
 * `shared/domain/entities/savedBlock.ts` cuando la biblioteca pasó a tener
 * puerto —vivía en un almacén de `zustand` y se vaciaba al recargar—. La
 * decisión de fondo, «se referencia el vocabulario, se copia la decisión», está
 * explicada allí.
 */
export type { SavedBlock } from '@/shared/domain/entities/savedBlock'

