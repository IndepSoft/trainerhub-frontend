import { container } from '@/app/container'
import { crewScope } from '@/app/crewScope'
import { useCachedQuery } from '@/shared/hooks/useCachedQuery'
import type { Student } from '@/shared/domain/entities/student'

interface UseStudentsResult {
  students: Student[]
  loading: boolean
  error: string | null
}

/** Referencia estable para el «todavía nada»: un literal nuevo por renderizado haría trabajo de más. */
const NONE: Student[] = []

/**
 * Lista de estudiantes.
 *
 * Lee del puerto, no de un fichero de datos simulados. Ese cambio es lo que
 * permite que el calendario use la misma fuente sin importar nada de este
 * dominio: si aquí siguiera leyendo el mock directamente y el calendario fuese
 * por el puerto, habría dos caminos hacia el mismo dato, que es peor que el
 * acoplamiento que se quería quitar.
 *
 * Importar `container` desde un hook de dominio es el patrón ya establecido en
 * el proyecto —lo hacen `useLogin` y `useViewer`—: el hook depende del puerto,
 * y la raíz de composición es quien decide la implementación.
 */
export function useStudents(): UseStudentsResult {
  const { data, loading, error } = useCachedQuery<Student[]>({
    /*
     * El equipo activo entra en la clave. Sin él, al cambiar de equipo se
     * pintaría un instante lo del anterior, que es justo la fuga que el
     * ámbito existe para evitar.
     */
    key: ['students', crewScope.current()],
    load: () => container.students.findAll(),
    // Suscrito: un alta tiene que verse sin recargar.
    subscribe: (reload) => container.students.onChange(reload),
    initial: NONE,
    errorKey: 'students.loadError',
  })

  return { students: data, loading, error }
}
