import type { Session } from './entities/session'

/**
 * Lo que una sesión ES según su estado y el día que es hoy.
 *
 * `pending` y `confirmed` son «abierta»: todavía puede ocurrir. Pero una
 * abierta cuyo día ya pasó NO va a ocurrir, y hasta ahora nada lo decía:
 * seguía contando como «por hacer», «Mover una semana» la llevaba a otro día
 * ya pasado, y el contador de pendientes de la agenda sólo crecía. Aquí se
 * DERIVA -no se guarda- un tercer estado, «no ocurrió», que es lo que la
 * agenda pinta y lo que las acciones en bloque dejan quieto.
 *
 * Derivado y no columna, a propósito: un estado guardado exigiría que alguien
 * lo escribiera cada noche, y el día que nadie abriera la aplicación se
 * quedaría atrás. La fecha ya lo sabe.
 */
export function isOpenSession(session: Session): boolean {
  return session.status === 'pending' || session.status === 'confirmed'
}

/** Abierta y con el día ya pasado: no ocurrió. */
export function isMissedSession(session: Session, todayKey: string): boolean {
  return isOpenSession(session) && session.date < todayKey
}

/** Abierta y todavía por venir: es lo que se puede mover o cancelar en bloque. */
export function isUpcomingSession(session: Session, todayKey: string): boolean {
  return isOpenSession(session) && session.date >= todayKey
}
