import { useMemo, useState } from 'react'
import { sessionsMock } from '../data/sessions.mock'
import { addDays, getWeekDates, toLocalDateKey } from '../libs/calendar.utils'
import type {
  CalendarViewMode,
  Session,
  SessionStatus,
} from '../types/calendar.types'

interface UseCalendarResult {
  sessions: Session[]
  currentDate: Date
  weekDates: Date[]
  viewMode: CalendarViewMode
  selectedSession: Session | null
  countByStatus: Record<SessionStatus, number>
  setViewMode: (mode: CalendarViewMode) => void
  goToToday: () => void
  goToPrevious: () => void
  goToNext: () => void
  selectSession: (session: Session | null) => void
  getSessionsAt: (date: Date, time: string) => Session[]
}

/**
 * Estado y navegación de la agenda.
 *
 * Concentra lo que la página hacía por su cuenta: guardar la fecha y el modo de
 * vista, mover la semana o el día, filtrar sesiones por tramo y contar por
 * estado. La página queda como composición.
 *
 * `goToPrevious` y `goToNext` avanzan una semana o un día según el modo, de modo
 * que la vista ya no tiene que decidir a qué función llamar en cada botón, como
 * pasaba antes con `navigateWeek` y `navigateDay`.
 */
export function useCalendar(): UseCalendarResult {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const sessions = sessionsMock

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])

  /**
   * Índice de sesiones por `fecha|hora`.
   *
   * Antes cada celda de la rejilla recorría el array entero: siete días por
   * veintisiete tramos son 189 recorridos completos en cada render. Con el
   * índice, cada celda es una consulta directa.
   */
  const sessionsBySlot = useMemo(() => {
    const index = new Map<string, Session[]>()
    for (const session of sessions) {
      const key = `${session.date}|${session.time}`
      const slot = index.get(key)
      if (slot) {
        slot.push(session)
      } else {
        index.set(key, [session])
      }
    }
    return index
  }, [sessions])

  const countByStatus = useMemo(() => {
    const counts: Record<SessionStatus, number> = {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
    }
    for (const session of sessions) {
      counts[session.status] += 1
    }
    return counts
  }, [sessions])

  const getSessionsAt = (date: Date, time: string): Session[] =>
    sessionsBySlot.get(`${toLocalDateKey(date)}|${time}`) ?? []

  const moveBy = (days: number) => setCurrentDate(addDays(currentDate, days))
  const step = viewMode === 'week' ? 7 : 1

  return {
    sessions,
    currentDate,
    weekDates,
    viewMode,
    selectedSession,
    countByStatus,
    setViewMode,
    goToToday: () => setCurrentDate(new Date()),
    goToPrevious: () => moveBy(-step),
    goToNext: () => moveBy(step),
    selectSession: setSelectedSession,
    getSessionsAt,
  }
}
