import type { Student, StudentLevel } from '@/shared/domain/entities/student'
import { normalizeForSearch } from '@/shared/lib/searchText'

/** Lo que la barra de filtros deja elegir. `'all'` es «sin filtrar por nivel». */
export interface StudentFilterState {
  query: string
  level: StudentLevel | 'all'
}

export const EMPTY_STUDENT_FILTERS: StudentFilterState = { query: '', level: 'all' }

/**
 * Filtra la lista en memoria.
 *
 * EN MEMORIA Y NO EN EL PUERTO, a propósito: la lista de un equipo son decenas
 * de fichas, ya cargadas, y buscar por nombre es escribir y ver. Pedirle al
 * servidor cada tecla sería más lento que filtrar lo que ya está aquí, y el
 * puerto seguiría siendo de negocio —«los alumnos del equipo»— y no de consulta.
 *
 * Sin tildes ni mayúsculas: «jose» encuentra a «José».
 */
export function filterStudents(students: Student[], filters: StudentFilterState): Student[] {
  const needle = normalizeForSearch(filters.query)

  return students.filter((student) => {
    if (filters.level !== 'all' && student.level !== filters.level) return false
    if (needle === '') return true

    const haystack = normalizeForSearch(
      `${student.firstName} ${student.lastName} ${student.email}`
    )
    return haystack.includes(needle)
  })
}
