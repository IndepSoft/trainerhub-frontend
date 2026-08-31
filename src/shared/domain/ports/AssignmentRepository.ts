import type { Assignment, NewAssignment } from '../entities/assignment'

/**
 * Puerto de asignaciones.
 *
 * `findByStudent` es la única lectura porque es la única pregunta que se hace
 * hoy: «qué tiene asignado esta persona». El día que haga falta la contraria
 * —«a quién le he asignado este plan»— se añade `findByTarget`, y no antes: un
 * puerto se llena de métodos que nadie llama con una facilidad asombrosa.
 */
export interface AssignmentRepository {
  findByStudent(studentId: string): Promise<Assignment[]>
  create(data: NewAssignment): Promise<Assignment>
  remove(assignmentId: string): Promise<void>
  onChange(listener: () => void): () => void
}
