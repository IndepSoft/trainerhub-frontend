import type { NewRoutine } from '@/shared/domain/ports/RoutineRepository'
import type { Block, PrescribedExercise, Routine } from '../types/training.types'
import type {
  BlockDraft,
  PrescribedExerciseDraft,
  RoutineDraft,
  RoutineDraftErrors,
} from '../types/routineDraft.types'
import type { Translate } from '@/shared/i18n/LanguageContext'

/**
 * Traducción entre el borrador y la entidad, y su validación. Funciones puras,
 * sin React y sin estado.
 */

/**
 * Prescripción con la que aparece un ejercicio recién añadido.
 *
 * No son valores neutros: son los de un trabajo de hipertrofia corriente, que
 * es el caso mayoritario. Un formulario que arranca vacío obliga a rellenar
 * cinco campos para el caso normal; uno que arranca en lo habitual deja al
 * entrenador cambiar sólo lo que se aparta de la norma.
 */
const DEFAULT_SETS = '3'
const DEFAULT_REPS = '8-10'
const DEFAULT_REST_SECONDS = '90'
const DEFAULT_BLOCK_REST_SECONDS = '90'

/**
 * Identificadores del borrador.
 *
 * `crypto.randomUUID` y no un contador de módulo: el contador se reinicia con
 * cada recarga y volvería a emitir identificadores ya usados por las rutinas
 * que siguen en memoria. Está disponible en todo contexto seguro, y `localhost`
 * lo es.
 */
function createIdentifier(): string {
  return crypto.randomUUID()
}

export function createExerciseDraft(): PrescribedExerciseDraft {
  return {
    id: createIdentifier(),
    exerciseId: '',
    sets: DEFAULT_SETS,
    reps: DEFAULT_REPS,
    rir: '',
    restSeconds: DEFAULT_REST_SECONDS,
  }
}

/**
 * Un bloque nuevo nace con un ejercicio dentro.
 *
 * Un bloque vacío no es un estado que el entrenador quiera: siempre va a añadir
 * al menos uno, y dejarlo vacío le cuesta una pulsación más y hace que la
 * validación le grite por algo que no ha llegado a decidir.
 */
export function createBlockDraft(): BlockDraft {
  return {
    id: createIdentifier(),
    method: 'simple',
    restAfterSeconds: DEFAULT_BLOCK_REST_SECONDS,
    exercises: [createExerciseDraft()],
    notes: '',
  }
}

export function createEmptyRoutineDraft(): RoutineDraft {
  return {
    title: '',
    description: '',
    level: 'Principiante',
    blocks: [createBlockDraft()],
  }
}

/**
 * Un bloque existente, como borrador. CONSERVA los identificadores.
 *
 * Editar no es copiar: se está abriendo lo que ya existe, y regenerar los
 * identificadores dejaría una rutina con el mismo contenido y otras claves
 * internas. Hoy no lo notaría nadie —nada externo apunta a un bloque— pero es
 * la clase de detalle que rompe lo primero que quiera comparar dos versiones.
 *
 * La biblioteca sí copia, y para eso tiene `copyBlockToDraft`.
 */
export function toBlockDraft(block: Block): BlockDraft {
  return {
    id: block.id,
    method: block.method,
    restAfterSeconds: String(block.restAfterSeconds),
    notes: block.notes ?? '',
    exercises: block.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      sets: String(exercise.sets),
      reps: exercise.reps,
      // Ausente y cero son cosas distintas, y el texto vacío es el ausente.
      rir: exercise.rir === undefined ? '' : String(exercise.rir),
      restSeconds: String(exercise.restSeconds),
    })),
  }
}

/** Una rutina existente, como borrador, para editarla. */
export function toRoutineDraft(routine: Routine): RoutineDraft {
  return {
    title: routine.title,
    description: routine.description,
    level: routine.level,
    blocks: routine.blocks.map(toBlockDraft),
  }
}

/**
 * Texto a entero, tolerante.
 *
 * Devuelve 0 ante cualquier cosa que no sea un entero: el resumen en vivo tiene
 * que poder estimar una rutina a medio escribir sin reventar. Guardar con
 * basura no llega a pasar porque `validateRoutineDraft` corre antes.
 */
function parseWholeNumber(value: string): number {
  const parsed = Number.parseInt(value.trim(), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

/** Texto opcional: lo que queda en blanco no viaja como cadena vacía. */
function parseOptionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * El RIR ausente y el RIR cero son cosas distintas.
 *
 * Vacío significa «no aplica» —trabajo técnico, movilidad— y desaparece del
 * dato. Cero significa «al fallo», que es una prescripción de verdad y tiene
 * que sobrevivir a la conversión.
 */
function parseRepetitionsInReserve(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toPrescribedExercise(draft: PrescribedExerciseDraft): PrescribedExercise {
  return {
    id: draft.id,
    exerciseId: draft.exerciseId,
    sets: parseWholeNumber(draft.sets),
    reps: draft.reps.trim(),
    rir: parseRepetitionsInReserve(draft.rir),
    restSeconds: parseWholeNumber(draft.restSeconds),
  }
}

/** Un bloque del borrador, ya como entidad. Lo usa tambien la biblioteca. */
export function toBlock(draft: BlockDraft): Block {
  return {
    id: draft.id,
    method: draft.method,
    restAfterSeconds: parseWholeNumber(draft.restAfterSeconds),
    exercises: draft.exercises.map(toPrescribedExercise),
    notes: parseOptionalText(draft.notes),
  }
}

/**
 * Borrador a rutina, sin identificador.
 *
 * El `id` no lo pone esta función: lo asigna quien la guarda, igual que lo haría
 * un backend. Que el formulario invente identificadores de entidad sería
 * inventarse una responsabilidad del almacén.
 *
 * Sirve para dos cosas a la vez: guardar, y alimentar el resumen en vivo. Que
 * sean el mismo camino es lo que garantiza que la duración estimada que el
 * entrenador ve mientras escribe sea exactamente la que quedará guardada.
 */
export function toRoutineData(draft: RoutineDraft): NewRoutine {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    level: draft.level,
    blocks: draft.blocks.map(toBlock),
  }
}

/**
 * Rutina de mentira para el resumen en vivo.
 *
 * `estimateRoutineMinutes` y compañía piden una `Routine` entera, y el borrador
 * todavía no tiene identificador. Antes que duplicar los cálculos sobre el
 * borrador —dos implementaciones de la misma fórmula que se separan al primer
 * cambio—, se le presta uno que nunca sale de aquí.
 */
export function toRoutinePreview(draft: RoutineDraft): Routine {
  return { id: 'preview', crewId: 'preview', ...toRoutineData(draft) }
}

/**
 * Validación del borrador.
 *
 * Devuelve un único mensaje por grupo, y el primero que falla. Enumerar los
 * catorce problemas de una rutina a medio hacer no ayuda a arreglar ninguno: el
 * entrenador corrige uno, vuelve a guardar y ve el siguiente, que es como se
 * usa un formulario largo de verdad.
 */
/* Traducir llega por parametro: son funciones puras, no componentes. */
export function validateRoutineDraft(draft: RoutineDraft, t: Translate): RoutineDraftErrors {
  const errors: RoutineDraftErrors = {}

  if (draft.title.trim() === '') {
    errors.title = t('routine.needsName')
  }

  if (draft.blocks.length === 0) {
    errors.blocks = t('routine.needsBlock')
    return errors
  }

  for (const [index, block] of draft.blocks.entries()) {
    const position = index + 1

    if (block.exercises.length === 0) {
      errors.blocks = `El bloque ${position} no tiene ejercicios: añade uno o elimina el bloque.`
      return errors
    }

    for (const exercise of block.exercises) {
      if (exercise.exerciseId === '') {
        errors.blocks = `Falta elegir un ejercicio en el bloque ${position}.`
        return errors
      }

      if (parseWholeNumber(exercise.sets) < 1) {
        errors.blocks = `Las series del bloque ${position} tienen que ser un número mayor que cero.`
        return errors
      }

      if (exercise.reps.trim() === '') {
        errors.blocks = `Faltan las repeticiones en el bloque ${position}.`
        return errors
      }
    }
  }

  return errors
}

export function hasErrors(errors: RoutineDraftErrors): boolean {
  return Object.keys(errors).length > 0
}
