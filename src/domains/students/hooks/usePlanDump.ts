import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Session } from '@/shared/domain/entities/session'
import type { NewSession } from '@/shared/domain/ports/SessionRepository'
import { useDumpedSessions } from './useDumpedSessions'

interface UsePlanDumpOptions {
  /** La asignación que se vuelca: cada sesión creada la guarda. */
  assignmentId: string
  /** Desde cuándo cuenta la semana 1, `YYYY-MM-DD`. */
  startDate: string
  /** Cuántas semanas tiene el plan: es lo que decide hasta dónde mirar. */
  weekCount: number
  /** Sin el diálogo abierto no se lee el intervalo. */
  enabled: boolean
}

interface UsePlanDumpResult {
  /** Lo que ya hay en la agenda durante las semanas del plan. */
  existingSessions: Session[]
  /**
   * Cuántas sesiones salieron ya de esta asignación. Volcar dos veces
   * duplicaba en silencio; con esto se dice.
   */
  alreadyDumped: number
  /** Todas o ninguna. Rechaza si la base no admite el lote. */
  dumpSessions: (sessions: NewSession[]) => Promise<void>
}

/**
 * Lo que el volcado de un plan necesita de la agenda: qué hay ya en esas
 * semanas, si esta asignación se volcó antes, y la escritura del lote.
 *
 * LO YA VOLCADO LO CUENTA `useDumpedSessions`, que es la misma pregunta que
 * hacen las acciones en bloque de la asignación. Contarlo aquí por separado
 * sería una segunda lectura de lo mismo con otra vida.
 */
export function usePlanDump({
  assignmentId,
  startDate,
  weekCount,
  enabled,
}: UsePlanDumpOptions): UsePlanDumpResult {
  const { sessions: dumpedSessions } = useDumpedSessions(assignmentId)
  const [existingSessions, setExistingSessions] = useState<Session[]>([])

  /*
   * Se cargan las sesiones del INTERVALO que abarca el plan, no la agenda
   * entera: son cuatro semanas, y con backend real la diferencia es una consulta
   * acotada frente a descargarlo todo.
   */
  useEffect(() => {
    if (!enabled) return

    const lastDay = addWeeks(startDate, weekCount)

    let active = true
    container.sessions.findBetween(startDate, lastDay).then((result) => {
      if (active) setExistingSessions(result)
    })

    return () => {
      active = false
    }
  }, [enabled, weekCount, startDate])

  /*
   * Todas o ninguna, y cada una con la asignacion de la que salio. Eran doce
   * altas sueltas en serie, y una red que se cae a mitad dejaba medio plan en
   * la agenda.
   */
  const dumpSessions = useCallback(
    async (sessions: NewSession[]): Promise<void> => {
      await container.sessions.createMany(sessions, assignmentId)
    },
    [assignmentId]
  )

  return { existingSessions, alreadyDumped: dumpedSessions.length, dumpSessions }
}

/** Suma semanas a una clave de fecha, construyéndola por partes. */
function addWeeks(dateKey: string, weeks: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const result = new Date(year, month - 1, day + weeks * 7)
  const resultMonth = String(result.getMonth() + 1).padStart(2, '0')
  const resultDay = String(result.getDate()).padStart(2, '0')
  return `${result.getFullYear()}-${resultMonth}-${resultDay}`
}
