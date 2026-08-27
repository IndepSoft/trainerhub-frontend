import { studentsMock } from '../data/students.mock'
import type { Student } from '../types/student.types'

/**
 * Única fuente de datos de estudiantes.
 *
 * Misma costura que `useDashboardSummary`: cuando llegue el backend, este hook
 * pasará a llamar al puerto vía `container` y ni la página ni los componentes
 * se enterarán.
 *
 * Devuelve `loading` y `error` desde ya, aunque hoy sean constantes, para que
 * los consumidores contemplen esos estados desde el principio y añadirlos
 * después no obligue a tocarlos.
 */
interface UseStudentsResult {
  students: Student[]
  loading: boolean
  error: string | null
}

export function useStudents(): UseStudentsResult {
  return {
    students: studentsMock,
    loading: false,
    error: null,
  }
}
