import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Student } from '@/shared/domain/entities/student'

interface UseSchedulableStudentsResult {
  students: Student[]
  loading: boolean
  error: string | null
}

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
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    container.students
      .findAll()
      .then((result) => {
        if (active) setStudents(result)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Error al cargar alumnos')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { students, loading, error }
}
