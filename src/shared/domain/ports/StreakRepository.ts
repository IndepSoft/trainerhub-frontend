import type { StreakPause } from '../entities/progress'

/**
 * Puerto de las pausas de racha.
 *
 * Una racha que se pierde por una lesión, un viaje o un descanso que el propio
 * plan programaba no mide constancia. Lesión y viaje las escribe quien
 * gestiona alumnos; el comodín lo usa el propio alumno, con un límite que
 * cuenta la base: no hay contador que envejezca.
 */
export interface StreakRepository {
  /** Las pausas de un alumno. La racha las salta. */
  pausesOf(studentId: string): Promise<StreakPause[]>

  /** Cuántos comodines le quedan hoy. */
  wildcardsAvailable(studentId: string): Promise<number>

  /** Pausa por lesión o viaje. Sólo quien gestiona alumnos. */
  pause(input: StreakPauseInput): Promise<void>

  /** Cubre UN día ya pasado con un comodín. Sólo el propio alumno. */
  useWildcard(studentId: string, day: string): Promise<void>

  /** Avisa de que algo ha cambiado. Devuelve la función de baja. */
  onChange(listener: () => void): () => void
}

export interface StreakPauseInput {
  studentId: string
  fromDay: string
  toDay: string
  reason: 'injury' | 'travel'
}
