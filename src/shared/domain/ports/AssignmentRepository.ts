import type { Assignment, NewAssignment } from '../entities/assignment'

/**
 * Puerto de asignaciones.
 *
 * Dos lecturas, una por pregunta: «qué tiene asignado esta persona» y «a quién
 * le he asignado este plan». La segunda llegó cuando hizo falta —borrar un plan
 * asignado dejaba la ficha del alumno apuntando al vacío— y no antes: un puerto
 * se llena de métodos que nadie llama con una facilidad asombrosa.
 */
export interface AssignmentRepository {
  findByStudent(studentId: string): Promise<Assignment[]>
  /** Las asignaciones de un plan, en el crew activo. Para saber si se puede borrar. */
  findByPlan(planId: string): Promise<Assignment[]>
  create(data: NewAssignment): Promise<Assignment>
  remove(assignmentId: string): Promise<void>
  onChange(listener: () => void): () => void
}
