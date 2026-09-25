import { container } from '@/app/container'
import { crewScope } from '@/app/crewScope'
import { useCachedQuery } from '@/shared/hooks/useCachedQuery'
import type { Student } from '@/shared/domain/entities/student'

interface UseSchedulableStudentsResult {
  students: Student[]
  loading: boolean
  error: string | null
}

/** Referencia estable para el «todavía nada». */
const NONE: Student[] = []

/**
 * Alumnos que el calendario puede agendar.
 *
 * Existe para que este dominio NO importe el hook de `students`. Antes lo hacía,
 * y era el único cruce entre dominios de todo el proyecto: un cambio en la firma
 * de `useStudents` rompía el calendario sin que nada lo señalara.
 *
 * Los dos dominios leen ahora del mismo puerto, así que siguen viendo los mismos
 * alumnos —que era el motivo por el que se hizo el atajo— pero ninguno depende
 * del otro.
 */
export function useSchedulableStudents(): UseSchedulableStudentsResult {
  const { data, loading, error } = useCachedQuery<Student[]>({
    // El equipo activo, en la clave: lo de un equipo no responde por otro.
    key: ['students', crewScope.current()],
    load: () => container.students.findAll(),
    subscribe: (reload) => container.students.onChange(reload),
    initial: NONE,
    errorKey: 'calendar.studentsError',
  })

  return { students: data, loading, error }
}
