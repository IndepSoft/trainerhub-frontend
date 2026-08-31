import type { Session } from '@/shared/domain/entities/session'
import type { Student } from '@/shared/domain/entities/student'

/**
 * El nombre que muestra una sesión. Función pura.
 *
 * La sesión guarda el identificador del alumno, no su nombre, así que resolverlo
 * es trabajo de la vista. Se hace en un solo sitio para que las tres superficies
 * —tarjeta, celda semanal y ficha— digan exactamente lo mismo, incluido el caso
 * en que el alumno ya no está.
 */
export function resolveSessionStudentName(
  session: Session,
  studentsById: Map<string, Student>
): string {
  if (session.kind === 'group' || session.studentId === null) return 'Clase grupal'

  const student = studentsById.get(session.studentId)
  // Un alumno que ya no existe deja la sesión sin nombre, no sin sentido: la
  // sesión ocurrió igual, y ocultarla seria perder una hora de la agenda.
  if (student === undefined) return 'Alumno no disponible'

  return `${student.firstName} ${student.lastName}`
}
