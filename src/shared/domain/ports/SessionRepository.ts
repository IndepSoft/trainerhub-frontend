import type { Session, SessionResult, SessionStatus } from '../entities/session'

/**
 * Puerto de acceso a sesiones.
 *
 * Nace cuando la ficha del estudiante pasa a listar y agendar las suyas: hasta
 * entonces sólo las usaba `calendar`, y un puerto para un consumidor único es la
 * forma del patrón sin su razón.
 *
 * `findByStudent` es una operación de NEGOCIO, no un filtro genérico. El puerto
 * dice qué necesita la aplicación —«las sesiones de este alumno»— y no cómo
 * buscarlas: un `find(criteria)` habría repartido el lenguaje de consulta del
 * proveedor por los dos dominios, que es justo lo que se eliminó con
 * `useSupabaseQuery`.
 */
export interface SessionRepository {
  findAll(): Promise<Session[]>
  /**
   * Una sesión por su identificador, para poder ejecutarla.
   *
   * `null` cuando no existe: un enlace a una sesión ya borrada es un resultado
   * válido y la pantalla debe poder pintarlo.
   */
  findById(sessionId: string): Promise<Session | null>
  /** Las de un alumno, ordenadas de la más próxima a la más lejana. */
  findByStudent(studentId: string): Promise<Session[]>
  /**
   * Las de un día, para saber qué hay ocupado antes de agendar.
   *
   * Acotado a propósito: con un backend real, comprobar un choque no puede
   * significar descargar la agenda entera.
   */
  findByDate(date: string): Promise<Session[]>
  /**
   * Las de un intervalo, ambos extremos incluidos.
   *
   * La pide el volcado de un plan: comprobar los choques de doce sesiones
   * repartidas en cuatro semanas con doce llamadas a `findByDate` seria doce
   * viajes para una sola pregunta.
   */
  findBetween(from: string, to: string): Promise<Session[]>
  create(data: NewSession): Promise<Session>
  update(sessionId: string, data: NewSession): Promise<void>
  /** Cambia sólo el estado. Es la operación que más se hace sobre una sesión. */
  updateStatus(sessionId: string, status: SessionStatus): Promise<void>
  /**
   * Cierra una sesión: la deja `completed` y anota lo que ocurrió.
   *
   * Operación propia y no `updateStatus('completed')` seguido de un `update`.
   * Son dos escrituras para un solo hecho, y entre las dos la sesión queda
   * completada sin resultado —justo el estado que el progreso no sabe leer—. Con
   * un backend real, además, esto es una transacción.
   */
  complete(sessionId: string, result: SessionResult): Promise<void>
  remove(sessionId: string): Promise<void>
  /** Avisa de que la colección ha cambiado. Devuelve la función de baja. */
  onChange(listener: () => void): () => void
}

/**
 * Los datos de un alta. Sin `crewId`: lo pone el adaptador desde el ámbito
 * activo, para que ningún formulario tenga que saber de multi-tenencia ni pueda
 * equivocarse de crew. Ver `CrewScope`.
 */
export type NewSession = Omit<Session, 'id' | 'crewId'>
