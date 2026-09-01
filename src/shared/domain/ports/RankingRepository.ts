/**
 * Puerto del ranking del equipo.
 *
 * PUERTO PROPIO, Y POR UN MOTIVO DE PRIVACIDAD, no de orden. Un ranking se
 * calcula a partir de las sesiones de todo el equipo, y un alumno **no puede
 * leerlas**: su ámbito le deja ver las suyas y las de grupo, que es justo lo que
 * hay que proteger —con quién entrena el entrenador, a qué hora y dónde—.
 *
 * Calcularlo en el cliente exigiría abrirle esas sesiones, es decir, romper el
 * aislamiento para pintar una tabla. Un ranking es un AGREGADO: se pide ya
 * resuelto, con lo justo para pintarlo, y las sesiones de nadie cruzan la
 * frontera.
 *
 * Con backend esto es una consulta agregada o una vista; aquí lo resuelve el
 * adaptador falso, que sí ve el almacén entero.
 */
export interface RankingRepository {
  /** La clasificación del crew activo, de más a menos experiencia. */
  ofCrew(period: RankingPeriod): Promise<RankingEntry[]>

  /** Avisa de que algo ha cambiado. Devuelve la función de baja. */
  onChange(listener: () => void): () => void
}

/**
 * Sobre qué tramo se compite.
 *
 * POR PERIODO, Y NO SÓLO HISTÓRICO. Un ranking por experiencia total se congela:
 * quien lleva dos años gana siempre y quien entra hoy no puede alcanzarle nunca,
 * así que a las tres semanas deja de mirarlo. Uno que se puede ganar el lunes es
 * el que motiva. El histórico se queda como vista secundaria, que es donde no
 * hace daño.
 */
export type RankingPeriod = 'week' | 'month' | 'all'

/**
 * Una posición del ranking.
 *
 * SÓLO ESFUERZO: sesiones completadas y experiencia. Nunca peso, grasa corporal
 * ni ninguna medida del cuerpo. Comparar públicamente cuerpos en una aplicación
 * de entrenamiento hace daño a la gente a la que más habría que cuidar, y no
 * mide el trabajo de nadie: la experiencia se gana entrenando, el peso no.
 */
export interface RankingEntry {
  studentId: string
  firstName: string
  lastName: string
  photoUrl?: string
  experience: number
  completedSessions: number
}
