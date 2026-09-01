import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Student } from '@/shared/domain/entities/student'

interface UseStudentsResult {
  students: Student[]
  loading: boolean
  error: string | null
}

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
 * el proyecto —lo hacen `useLogin` y `useTrainer`—: el hook depende del puerto,
 * y la raíz de composición es quien decide la implementación.
 */
export function useStudents(): UseStudentsResult {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Bandera de cancelación: si el componente se desmonta antes de que
    // resuelva, escribir estado provocaría una advertencia y, con red real, una
    // respuesta vieja podría pisar a una nueva.
    let active = true

    const load = () => {
      container.students
        .findAll()
        .then((result) => {
          if (active) setStudents(result)
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : 'Error al cargar estudiantes')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    load()
    // Suscrito: dar de alta a un alumno tiene que verse sin recargar.
    const unsubscribe = container.students.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { students, loading, error }
}
