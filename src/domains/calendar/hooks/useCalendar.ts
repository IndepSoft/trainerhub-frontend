import { useMemo, useState } from 'react'
import { useIsMobile } from '@/shared/hooks/useIsMobile'
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
  /**
   * Modo efectivo. En movil siempre es 'day': la rejilla semanal necesita ocho
   * columnas y por debajo de 768 px eso deja 33 px por columna, donde no cabe
   * ni el nombre del dia.
   */
  viewMode: CalendarViewMode
  /** false en movil, donde el modo esta forzado y el selector se oculta. */
  canChooseViewMode: boolean
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
  const isMobile = useIsMobile()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [preferredViewMode, setPreferredViewMode] = useState<CalendarViewMode>('week')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  // La preferencia del usuario se conserva aparte del modo efectivo: si vuelve a
  // una pantalla ancha, recupera la vista que tenia elegida en vez de quedarse
  // en la diaria.
  const viewMode: CalendarViewMode = isMobile ? 'day' : preferredViewMode

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
    canChooseViewMode: !isMobile,
    selectedSession,
    countByStatus,
    setViewMode: setPreferredViewMode,
    goToToday: () => setCurrentDate(new Date()),
    goToPrevious: () => moveBy(-step),
    goToNext: () => moveBy(step),
    selectSession: setSelectedSession,
    getSessionsAt,
  }
}
