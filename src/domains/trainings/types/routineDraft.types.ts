import type { BlockMethod, TrainingLevel } from './training.types'

/**
 * La rutina mientras se está escribiendo, que no es la misma cosa que la rutina.
 *
 * Todos los campos numéricos son `string` a propósito. Un `<input type="number">`
 * a medio teclear está legítimamente vacío —el usuario borró el 3 para escribir
 * un 4—, y modelarlo como `number` obliga a elegir entre dos malas salidas:
 * guardar `NaN`, que se propaga a todos los cálculos derivados, o guardar `0`,
 * que el usuario ve aparecer solo y tiene que volver a borrar.
 *
 * La conversión y la validación ocurren una sola vez, al guardar, en
 * `libs/routineDraft.ts`. Así el borrador puede estar incompleto sin que ninguna
 * entidad del dominio llegue a existir en un estado inválido.
 */
export interface PrescribedExerciseDraft {
  id: string
  /** Vacío mientras no se ha elegido del catálogo. */
  exerciseId: string
  sets: string
  reps: string
  /** Vacío es «no aplica», que no es lo mismo que 0 —«al fallo»—. */
  rir: string
  restSeconds: string
}

export interface BlockDraft {
  id: string
  method: BlockMethod
  restAfterSeconds: string
  exercises: PrescribedExerciseDraft[]
  notes: string
}

export interface RoutineDraft {
  title: string
  description: string
  level: TrainingLevel
  blocks: BlockDraft[]
}

/** Lo que puede cambiar de un bloque sin pasar por sus ejercicios. */
export type BlockDraftChanges = Partial<Pick<BlockDraft, 'method' | 'restAfterSeconds' | 'notes'>>

/** Lo que puede cambiar de un ejercicio prescrito. */
export type PrescribedExerciseDraftChanges = Partial<
  Pick<PrescribedExerciseDraft, 'exerciseId' | 'sets' | 'reps' | 'rir' | 'restSeconds'>
>

/**
 * Errores del borrador, agrupados por donde el usuario puede actuar.
 *
 * No hay una entrada por campo: un mensaje colgando de cada `<input>` de una
 * rutina con cinco bloques serían veinte avisos simultáneos y ninguno se leería.
 * `blocks` reúne lo que le pasa a la lista y señala el bloque concreto por su
 * número.
 */
export interface RoutineDraftErrors {
  title?: string
  blocks?: string
}
