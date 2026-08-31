import type { Session } from '../entities/session'

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
  /** Las de un alumno, ordenadas de la más próxima a la más lejana. */
  findByStudent(studentId: string): Promise<Session[]>
  create(data: Omit<Session, 'id'>): Promise<Session>
  update(sessionId: string, data: Omit<Session, 'id'>): Promise<void>
  /** Avisa de que la colección ha cambiado. Devuelve la función de baja. */
  onChange(listener: () => void): () => void
}
