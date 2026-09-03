import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Assignment, NewAssignment } from '@/shared/domain/entities/assignment'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface UseStudentAssignmentsResult {
  assignments: Assignment[]
  loading: boolean
  error: string | null
  assign: (data: NewAssignment) => Promise<void>
  unassign: (assignmentId: string) => Promise<void>
}

/**
 * Lo que un alumno tiene asignado, y las altas y bajas.
 *
 * Leer y escribir van juntos aquí, al revés que en rutinas o planes: la única
 * pantalla que asigna es la misma que lista, así que separarlos dejaría dos
 * hooks que siempre se llaman a la vez.
 *
 * Quitar una asignación NO borra nada más. Las sesiones que se hubieran volcado
 * de un plan siguen en la agenda: son compromisos con fecha y hora que alguien
 * puede haber comunicado ya. Desasignar dice «esto deja de ser tuyo de aquí en
 * adelante», no «nunca ocurrió».
 */
export function useStudentAssignments(studentId: string | undefined): UseStudentAssignmentsResult {
  const { t } = useTranslation()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (studentId === undefined) {
      setAssignments([])
      setLoading(false)
      return
    }

    let active = true

    const load = () => {
      container.assignments
        .findByStudent(studentId)
        .then((result) => {
          if (active) setAssignments(result)
        })
        .catch((cause: unknown) => {
          if (active) {
            setError(cause instanceof Error ? cause.message : t('students.assignmentsError'))
          }
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    load()
    const unsubscribe = container.assignments.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [studentId, t])

  const assign = useCallback(async (data: NewAssignment) => {
    await container.assignments.create(data)
  }, [])

  const unassign = useCallback(async (assignmentId: string) => {
    await container.assignments.remove(assignmentId)
  }, [])

  return { assignments, loading, error, assign, unassign }
}
