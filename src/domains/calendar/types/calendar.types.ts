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
  /**
   * La rutina que se ejecuta en la sesión, o `null` si no hay ninguna.
   *
   * Se guarda el IDENTIFICADOR y no una copia: si el entrenador corrige la
   * rutina, la sesión agendada refleja la corrección, que es lo que se espera de
   * algo que todavía no ha ocurrido. Es también lo que obligó a que `Routine`
   * subiera a `shared/domain`: dos dominios la necesitan.
   *
   * `null` es un caso corriente, no una carencia: una evaluación inicial o una
   * charla de seguimiento no ejecutan ninguna rutina.
   */
  routineId: string | null
}

export type CalendarViewMode = 'week' | 'day'
