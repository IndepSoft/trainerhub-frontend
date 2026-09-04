import type { CrewScope } from '@/shared/domain/ports/CrewScope'
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

  // Campo declarado y asignado, no propiedad de parametro: `erasableSyntaxOnly`
  // esta activo en el `tsconfig`, y esa azucar de TypeScript emite codigo.
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findByStudent(studentId: string): Promise<Assignment[]> {
    return this.inScope().filter((assignment) => assignment.studentId === studentId)
  }

  async create(data: NewAssignment): Promise<Assignment> {
    const crewId = this.scope.current()
    if (crewId === null) {
      // Escribir sin crew dejaria un huerfano invisible: no lo veria nadie,
      // porque toda lectura esta acotada. Mejor fallar aqui que guardar algo
      // que despues no aparece y nadie sabe por que.
      throw new Error('No hay ningun crew activo.')
    }

    // Sin `as`: `NewAssignment` conserva el discriminante, asi que esparcirlo
    // produce un miembro valido de la union por si solo.
    const assignment: Assignment = { id: crypto.randomUUID(), crewId, ...data }
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

  /**
   * Lo que pertenece al crew activo.
   *
   * Sin crew activo devuelve vacio, y no todo: es el caso de una cuenta recien
   * registrada, y enseñarle los datos de otro equipo seria justo el fallo de
   * aislamiento que la multi-tenencia existe para evitar. Es lo que hara
   * Postgres con RLS cuando exista; ver `CrewScope`.
   */
  private inScope(): Assignment[] {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const inCrew = this.assignments.filter((entrada) => entrada.crewId === crewId)

    // Lo asignado a otro alumno no es asunto de este. Mismo criterio que en las
    // sesiones; aqui no hay excepcion de grupo porque una asignacion siempre es
    // de alguien.
    const studentId = this.scope.asStudent()
    if (studentId === null) return inCrew
    return inCrew.filter((entrada) => entrada.studentId === studentId)
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
