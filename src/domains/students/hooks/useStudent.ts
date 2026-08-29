import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Student } from '@/shared/domain/entities/student'

interface UseStudentResult {
  student: Student | null
  loading: boolean
  error: string | null
}

/**
 * Un estudiante por su identificador.
 *
 * `null` cuando no existe, no una excepción: la ausencia es un resultado válido
 * —un enlace viejo, un identificador escrito a mano— y la vista debe poder
 * pintarla. Es la misma semántica de lo ausente que declaran los puertos.
 */
export function useStudent(studentId: string | undefined): UseStudentResult {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) {
      setStudent(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    container.students
      .findById(studentId)
      .then((result) => {
        if (active) setStudent(result)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Error al cargar el estudiante')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [studentId])

  return { student, loading, error }
}
