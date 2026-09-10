import type { Session } from './entities/session'

/**
 * Qué sesiones cuentan.
 *
 * AQUÍ YA NO HAY FÓRMULA. La experiencia era «20 + series» escrita dos veces
 * —aquí y en `crew_ranking`— y ahora es la puntuación que el servidor calcula
 * al cerrar cada sesión (`SessionScore.points`). Lo que se queda es lo que no
 * es una regla de puntos sino de recuento: cuáles se cerraron, y cuáles caen
 * en un tramo de fechas. Lo usan la racha, los hitos y el simulador.
 */

/** Sólo cuentan las cerradas, y sólo las que anotaron lo que ocurrió. */
export function completedSessions(sessions: Session[]): Session[] {
  return sessions.filter((session) => session.status === 'completed' && session.result !== null)
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
