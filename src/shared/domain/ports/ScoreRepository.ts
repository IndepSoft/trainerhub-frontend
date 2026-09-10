import type { Cohort, SessionScore } from '../entities/progress'

/**
 * Puerto de la puntuación: lo que cada sesión cerrada valió, y el agregado
 * por miembro del equipo.
 *
 * ABSORBE A `CrewProgressRepository`. El ranking y las tarjetas de alumno
 * pedían «cuánto ha entrenado cada miembro», y ese dato ahora es la suma de
 * puntos que el servidor ya calculó. Un puerto para leer puntuaciones y otro
 * para agregarlas serían dos definiciones de la misma cifra.
 *
 * `ofCrew` sigue resolviéndose en el servidor POR PRIVACIDAD, no por
 * rendimiento: un alumno no puede leer las puntuaciones de sus compañeros
 * —tampoco sus sesiones—, y el agregado viaja ya resuelto, con lo justo para
 * pintarlo.
 */
export interface ScoreRepository {
  /** Las puntuaciones de un alumno, de la más reciente a la más antigua. */
  ofStudent(studentId: string): Promise<SessionScore[]>

  /** La de una sesión concreta, o `null` si no puntuó: no cerrada, o grupal. */
  ofSession(sessionId: string): Promise<SessionScore | null>

  /**
   * El esfuerzo de cada miembro del crew activo, de más a menos puntos.
   *
   * Con cohorte, sólo los de esa cohorte: un juvenil no compite con un senior.
   * Sin ella, todo el equipo, que es lo que mira quien entrena.
   */
  ofCrew(period: ProgressPeriod, cohort?: Cohort | null): Promise<CrewMemberProgress[]>

  /** Las de un alumno marcadas por salto de carga y sin revisar. */
  flaggedOf(studentId: string): Promise<SessionScore[]>

  /** El entrenador da por buena la carga: se repuntúa confiando en ella. */
  acceptLoadJump(sessionId: string): Promise<void>

  /** Avisa de que algo ha cambiado. Devuelve la función de baja. */
  onChange(listener: () => void): () => void
}

/**
 * Sobre qué tramo se compite.
 *
 * POR PERIODO, Y NO SÓLO HISTÓRICO. Un ranking por puntos totales se congela:
 * quien lleva dos años gana siempre y quien entra hoy no puede alcanzarle nunca,
 * así que a las tres semanas deja de mirarlo. Uno que se puede ganar el lunes es
 * el que motiva. El histórico se queda como vista secundaria.
 */
export type ProgressPeriod = 'week' | 'month' | 'all'

/**
 * Una posición del ranking.
 *
 * SÓLO ESFUERZO: sesiones completadas y puntos. Nunca peso, grasa corporal ni
 * ninguna medida del cuerpo. Comparar públicamente cuerpos en una aplicación de
 * entrenamiento hace daño a la gente a la que más habría que cuidar, y no mide
 * el trabajo de nadie.
 */
export interface CrewMemberProgress {
  studentId: string
  firstName: string
  lastName: string
  photoUrl?: string
  /** La suma de puntos de sus sesiones en el periodo. */
  experience: number
  completedSessions: number
}
