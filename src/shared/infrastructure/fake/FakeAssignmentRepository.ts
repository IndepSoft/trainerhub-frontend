import type { AssignmentRepository } from '@/shared/domain/ports/AssignmentRepository'
import type { Assignment, NewAssignment } from '@/shared/domain/entities/assignment'
import { assignmentsSeed } from './assignmentsSeed'

/**
 * Asignaciones simuladas mientras no hay backend.
 *
 * Misma forma que los otros adaptadores falsos.
 *
 * TODO: los datos viven solo en memoria. Al recargar vuelve la semilla.
 */
export class FakeAssignmentRepository implements AssignmentRepository {
  private assignments: Assignment[] = assignmentsSeed
  private readonly listeners = new Set<() => void>()

  async findByStudent(studentId: string): Promise<Assignment[]> {
    return this.assignments.filter((assignment) => assignment.studentId === studentId)
  }

  async create(data: NewAssignment): Promise<Assignment> {
    // Sin `as`: `NewAssignment` conserva el discriminante, asi que esparcirlo
    // produce un miembro valido de la union por si solo.
    const assignment: Assignment = { id: crypto.randomUUID(), ...data }
    this.assignments = [assignment, ...this.assignments]
    this.notify()
    return assignment
  }

  async remove(assignmentId: string): Promise<void> {
    this.assignments = this.assignments.filter((assignment) => assignment.id !== assignmentId)
    this.notify()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
