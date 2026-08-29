import { studentsMock } from '../data/students.mock'
import type { Student } from '../types/student.types'

interface UseStudentResult {
  student: Student | null
  loading: boolean
  error: string | null
}

/**
 * Un estudiante por su identificador.
 *
 * Devuelve `null` cuando no existe, no una excepción: la ausencia es un
 * resultado válido —un enlace viejo, un identificador escrito a mano— y la
 * vista debe poder pintarla. Es la misma semántica que usan los puertos del
 * proyecto para lo ausente.
 *
 * Misma costura que el resto: cuando llegue el backend, esto llamará al
 * repositorio vía `container` y ni la página ni los componentes se enterarán.
 */
export function useStudent(studentId: string | undefined): UseStudentResult {
  if (!studentId) {
    return { student: null, loading: false, error: null }
  }

  const student = studentsMock.find((candidate) => candidate.id === studentId) ?? null

  return { student, loading: false, error: null }
}
