import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import type { Session } from '@/shared/domain/entities/session'

/**
 * Lo que ya hay en la agenda el día elegido, para marcar los tramos ocupados.
 *
 * Sólo ese día y no la agenda entera: `findByDate` es una consulta acotada, y
 * con backend real comprobar un choque no puede significar descargarlo todo.
 *
 * Vive en `shared` porque lo piden los dos formularios que agendan —el de la
 * agenda y el de la ficha del alumno—, igual que `SessionScheduleFields`, que
 * es quien pinta el resultado.
 */
export function useSessionsOfDay(date: Date | undefined): Session[] {
  const [sessionsOfDay, setSessionsOfDay] = useState<Session[]>([])

  useEffect(() => {
    if (date === undefined) {
      setSessionsOfDay([])
      return
    }

    let active = true
    container.sessions.findByDate(toLocalDateKey(date)).then((result) => {
      if (active) setSessionsOfDay(result)
    })

    return () => {
      active = false
    }
  }, [date])

  return sessionsOfDay
}
