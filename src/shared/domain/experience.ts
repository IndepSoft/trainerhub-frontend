import type { Session } from './entities/session'

/**
 * La experiencia: qué vale una sesión entrenada.
 *
 * SUBE A `shared/domain` PORQUE LA NECESITAN DOS DOMINIOS: el progreso de un
 * alumno y el ranking de su equipo. Es el mismo criterio que elevó `Routine`,
 * `Session` y `DeletionResult`. Y hay un motivo de fondo además del criterio:
 * si el ranking calculara la experiencia con su propia fórmula, dos pantallas de
 * la misma aplicación dirían dos cifras distintas del mismo esfuerzo.
 *
 * Lo que se queda en `progress` es lo que sólo le incumbe a una persona —nivel,
 * racha, hitos, logros—; lo que sube es lo que se compara.
 */

/**
 * Experiencia por terminar una sesión, sea del tipo que sea.
 *
 * Existe además de la de las series porque el cardio no tiene series: sin esto,
 * salir a correr una hora daría cero y la pantalla diría que no has hecho nada.
 */
export const EXPERIENCE_PER_SESSION = 20

/** Experiencia por serie marcada. La unidad en la que se programa la fuerza. */
export const EXPERIENCE_PER_SET = 1

/** Sólo cuentan las cerradas, y sólo las que anotaron lo que ocurrió. */
export function completedSessions(sessions: Session[]): Session[] {
  return sessions.filter((session) => session.status === 'completed' && session.result !== null)
}

/** Lo que vale una sesión cerrada. Cero si no se cerró. */
export function experienceOf(session: Session): number {
  if (session.status !== 'completed' || session.result === null) return 0
  return EXPERIENCE_PER_SESSION + session.result.completedSets * EXPERIENCE_PER_SET
}

/**
 * Experiencia total acumulada.
 *
 * Se suma sobre el historial cada vez que se pide. Con las cifras de una persona
 * —unos cientos de sesiones al año— recorrerlas es inmediato; el día que deje de
 * serlo, la suma la hace el servidor, y esta función sigue siendo la definición
 * de la regla.
 */
export function totalExperience(sessions: Session[]): number {
  return sessions.reduce((total, session) => total + experienceOf(session), 0)
}

/**
 * Las sesiones cerradas dentro de un tramo de fechas, ambos extremos incluidos.
 *
 * Filtra por `completedAt` y no por `date`, igual que la racha: `date` es cuándo
 * estaba agendada, y una sesión del martes que se cierra el miércoles es
 * esfuerzo del miércoles. En un ranking semanal esa diferencia decide quién gana.
 */
export function completedBetween(sessions: Session[], from: string, to: string): Session[] {
  return completedSessions(sessions).filter((session) => {
    const day = session.result?.completedAt
    return day !== undefined && day >= from && day <= to
  })
}
