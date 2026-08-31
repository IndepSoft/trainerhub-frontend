import type { Block, Exercise } from '../types/training.types'
import type { BlockDraft } from '../types/routineDraft.types'
import { BLOCK_METHOD_LABELS } from './routine.utils'
import { describeNames } from './catalogUsage'

/**
 * La biblioteca de bloques: copiar y nombrar. Funciones puras.
 */

/**
 * Un bloque de la biblioteca convertido en bloque del borrador.
 *
 * AQUÍ ES DONDE OCURRE LA COPIA. Cada identificador se genera de nuevo —el del
 * bloque y el de cada ejercicio prescrito—, así que lo insertado no comparte
 * nada con la entrada guardada. Reutilizarlos habría creado un vínculo
 * invisible: dos rutinas con el mismo `id` de bloque, y el primer intento de
 * editar una de ellas buscando por identificador tocando a las dos.
 *
 * Los números vuelven a texto porque el borrador tiene la forma del formulario,
 * no la de la entidad.
 */
export function toBlockDraft(block: Block): BlockDraft {
  return {
    id: crypto.randomUUID(),
    method: block.method,
    restAfterSeconds: String(block.restAfterSeconds),
    notes: block.notes ?? '',
    exercises: block.exercises.map((exercise) => ({
      id: crypto.randomUUID(),
      exerciseId: exercise.exerciseId,
      sets: String(exercise.sets),
      reps: exercise.reps,
      rir: exercise.rir === undefined ? '' : String(exercise.rir),
      restSeconds: String(exercise.restSeconds),
    })),
  }
}

/**
 * Un bloque sin ejercicio elegido no se guarda.
 *
 * La biblioteca es para reutilizar trabajo hecho, y una entrada cuyo contenido
 * es «(sin elegir) 3 × 8-10» no es trabajo hecho: al insertarla habría que
 * rellenarla igual, y mientras tanto ocupa sitio en la lista.
 */
export function canSaveBlockDraft(draft: BlockDraft): boolean {
  return (
    draft.exercises.length > 0 &&
    draft.exercises.every((exercise) => exercise.exerciseId !== '')
  )
}

/**
 * Nombre de una entrada, derivado de su contenido.
 *
 * Guardar no pregunta el nombre a propósito: un diálogo entre «esto me sirve» y
 * tenerlo guardado convierte en trámite lo que debería ser un gesto. El nombre
 * sale del método y de los ejercicios —«Superserie · Press de banca, Remo»—, que
 * es exactamente como lo describiría el entrenador, y se puede cambiar después
 * desde la biblioteca.
 */
export function describeBlock(block: Block, exercisesById: Map<string, Exercise>): string {
  const names = block.exercises.map(
    (prescribed) => exercisesById.get(prescribed.exerciseId)?.name ?? 'Ejercicio'
  )

  return `${BLOCK_METHOD_LABELS[block.method]} · ${describeNames(names)}`
}
