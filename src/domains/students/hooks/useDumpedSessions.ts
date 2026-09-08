import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Session } from '@/shared/domain/entities/session'

interface UseDumpedSessionsResult {
  /** Las que salieron de este volcado, en orden. */
  sessions: Session[]
  /** Las que todavía se pueden mover o cancelar. */
  openCount: number
  shiftOneWeek: () => Promise<number>
  cancelOpen: () => Promise<number>
}

/**
 * Lo que un volcado de plan dejó en la agenda, y lo que se puede hacer con ello
 * en bloque.
 *
 * ES LO QUE `assignment_id` HACE POSIBLE. Sin saber de qué volcado salió cada
 * sesión, mover un plan porque el alumno se va de viaje eran doce sesiones a
 * mano, y cancelarlo, doce más. Con el dato, son una operación cada uno.
 *
 * Una semana y no «N días»: es el desplazamiento que tiene sentido para un
 * plan semanal —el lunes sigue siendo lunes— y no pide un formulario.
 */
export function useDumpedSessions(assignmentId: string): UseDumpedSessionsResult {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    let active = true

    const load = () => {
      container.sessions.findByAssignment(assignmentId).then((result) => {
        if (active) setSessions(result)
      })
    }

    load()
    const unsubscribe = container.sessions.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [assignmentId])

  const openCount = sessions.filter(
    (session) => session.status === 'pending' || session.status === 'confirmed'
  ).length

  const shiftOneWeek = useCallback(
    () => container.sessions.shiftByAssignment(assignmentId, 7),
    [assignmentId]
  )

  const cancelOpen = useCallback(
    () => container.sessions.cancelByAssignment(assignmentId),
    [assignmentId]
  )

  return { sessions, openCount, shiftOneWeek, cancelOpen }
}
