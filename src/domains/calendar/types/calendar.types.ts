/**
 * Entidades de la agenda.
 *
 * `Session` estaba declarada dos veces: una a mano dentro de
 * `SessionDetailsModal` y otra inferida en la página con
 * `(typeof sessions)[0]`, o sea derivada de los datos simulados. Las dos podían
 * divergir sin que nadie se enterara, y la segunda ataba el tipo de la
 * aplicación a la forma de unos mocks.
 */

export type SessionStatus = 'confirmed' | 'pending' | 'cancelled'

export type SessionKind = 'individual' | 'group'

export interface Session {
  id: string
  title: string
  student: string
  kind: SessionKind
  category: string
  /** Fecha local en formato `YYYY-MM-DD`. Ver `toLocalDateKey`. */
  date: string
  /** Hora local en formato `HH:mm`, alineada con los tramos de la agenda. */
  time: string
  durationMinutes: number
  location: string
  status: SessionStatus
  notes: string
}

export type CalendarViewMode = 'week' | 'day'
