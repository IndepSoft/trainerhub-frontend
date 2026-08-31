import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Session } from '@/shared/domain/entities/session'

interface UseStudentSessionsResult {
  sessions: Session[]
  loading: boolean
  error: string | null
}

/**
 * Las sesiones de un alumno.
 *
 * Pide `findByStudent` al puerto en vez de traerlas todas y filtrar aquí: el
 * puerto expresa la intención —«las sesiones de este alumno»— y con un backend
 * real eso es una consulta acotada en vez de descargar la agenda entera para
 * quedarse con tres.
 *
 * Se suscribe a los cambios: agendar desde esta misma ficha tiene que verse sin
 * recargar, y también lo agendado desde la agenda.
 */
export function useStudentSessions(studentId: string | undefined): UseStudentSessionsResult {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (studentId === undefined) {
      setSessions([])
      setLoading(false)
      return
    }

    let active = true

    const load = () => {
      container.sessions
        .findByStudent(studentId)
        .then((result) => {
          if (active) setSessions(result)
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : 'Error al cargar sesiones')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    load()
    const unsubscribe = container.sessions.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [studentId])

  return { sessions, loading, error }
}
