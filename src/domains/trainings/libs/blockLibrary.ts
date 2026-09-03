import type { Block, Exercise } from '../types/training.types'
import type { BlockDraft } from '../types/routineDraft.types'
import { BLOCK_METHOD_LABEL_KEY } from '@/shared/i18n/domainLabels'
import { toBlockDraft } from './routineDraft'
import { describeNames } from './usage'
import type { Translate } from '@/shared/i18n/LanguageContext'

/**
 * La biblioteca de bloques: copiar y nombrar. Funciones puras.
 */

/**
 * Un bloque de la biblioteca, listo para insertarlo en una rutina.
 *
 * AQUÍ ES DONDE OCURRE LA COPIA, y es lo único que separa esta función de
 * `toBlockDraft`: cada identificador se genera de nuevo —el del bloque y el de
 * cada ejercicio prescrito—, así que lo insertado no comparte nada con la
 * entrada guardada. Reutilizarlos habría creado un vínculo invisible: dos
 * rutinas con el mismo `id` de bloque, y el primer intento de editar una de
 * ellas buscando por identificador tocando a las dos.
 *
 * Editar una rutina, en cambio, usa `toBlockDraft` y CONSERVA los
 * identificadores: ahí no se está copiando nada, se está abriendo lo que ya
 * existe.
 */
export function copyBlockToDraft(block: Block): BlockDraft {
  const draft = toBlockDraft(block)

  return {
    ...draft,
    id: crypto.randomUUID(),
    exercises: draft.exercises.map((exercise) => ({ ...exercise, id: crypto.randomUUID() })),
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
export function describeBlock(
  block: Block,
  exercisesById: Map<string, Exercise>,
  /* Traducir llega por parametro: es una funcion pura, no un componente. */
  t: Translate
): string {
  const names = block.exercises.map(
    (prescribed) => exercisesById.get(prescribed.exerciseId)?.name ?? t('exercise.fallback')
  )

  return `${t(BLOCK_METHOD_LABEL_KEY[block.method])} · ${describeNames(names)}`
}
