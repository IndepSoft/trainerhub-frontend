import type { RoutineDraft } from '../types/routineDraft.types'

/**
 * El borrador de rutina, guardado en el navegador mientras se escribe.
 *
 * SE PERDÍA EN EL CASO MÁS NORMAL: a medio formulario falta un ejercicio,
 * se va al catálogo a darlo de alta, y al volver la rutina está vacía. El
 * borrador vive ahora en `sessionStorage` -por pestaña, y muere al cerrarla-
 * bajo una clave por rutina, así editar una no pisa el alta de otra.
 *
 * Todo con `try/catch`: en modo privado o con el almacenamiento apagado el
 * acceso lanza, y un borrador que no se puede guardar no es motivo para que el
 * formulario deje de funcionar.
 */
const PREFIX = 'trainerhub.routine-draft.'

function keyFor(routineId: string | null): string {
  return `${PREFIX}${routineId ?? 'nueva'}`
}

export function readRoutineDraft(routineId: string | null): RoutineDraft | null {
  try {
    const raw = window.sessionStorage.getItem(keyFor(routineId))
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return isRoutineDraft(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeRoutineDraft(routineId: string | null, draft: RoutineDraft): void {
  try {
    window.sessionStorage.setItem(keyFor(routineId), JSON.stringify(draft))
  } catch {
    // Sin almacenamiento no hay borrador que recuperar, y no pasa nada más.
  }
}

export function clearRoutineDraft(routineId: string | null): void {
  try {
    window.sessionStorage.removeItem(keyFor(routineId))
  } catch {
    // Igual que arriba.
  }
}

/**
 * Lo guardado es dato externo: lo escribió otra versión de la aplicación, o
 * alguien desde la consola. Se comprueba la forma antes de creérselo.
 */
function isRoutineDraft(value: unknown): value is RoutineDraft {
  if (typeof value !== 'object' || value === null) return false
  if (!('title' in value) || typeof value.title !== 'string') return false
  if (!('blocks' in value) || !Array.isArray(value.blocks)) return false
  return value.blocks.every(
    (block: unknown) =>
      typeof block === 'object' &&
      block !== null &&
      'id' in block &&
      'exercises' in block &&
      Array.isArray(block.exercises)
  )
}
