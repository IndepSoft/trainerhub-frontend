import type { Session } from './entities/session'

/**
 * Reglas de ocupación de la agenda. Funciones puras, sin React.
 *
 * Viven en el dominio compartido y no en `calendar` porque hay TRES sitios que
 * agendan —el formulario de la agenda, el de la ficha del estudiante y, cuando
 * llegue, el generador de asignación masiva de planes— y una regla de negocio
 * repetida en tres sitios se separa en el primer cambio.
 */

/** Un hueco que se pretende ocupar. Aún no es una sesión. */
export interface ProposedSlot {
  /** Fecha local `YYYY-MM-DD`. */
  date: string
  /** Hora local `HH:mm`. */
  time: string
  durationMinutes: number
}

interface OverlapOptions {
  /**
   * Sesión que no cuenta como choque.
   *
   * Al editar una sesión, ella misma ocupa su propio hueco: sin excluirla,
   * mover una sesión diez minutos chocaría siempre consigo misma.
   */
  ignoreSessionId?: string
}

/** `HH:mm` a minutos desde medianoche. */
function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Sesiones que se solapan con el hueco propuesto.
 *
 * SE COMPARAN INTERVALOS, no horas de inicio. Una sesión de 90 minutos a las
 * 09:00 ocupa hasta las 10:30, así que choca con las 10:00 aunque sus horas de
 * inicio no coincidan. Comparar `time` habría dejado pasar justo los choques que
 * más cuesta ver.
 *
 * EL CRITERIO ES EL ENTRENADOR, no el alumno. La aplicación es de UN entrenador:
 * dos sesiones que se pisan son un imposible físico, sean del alumno que sean.
 * Comprobar sólo el mismo alumno dejaría al entrenador partido en dos.
 *
 * LAS CANCELADAS NO OCUPAN. Una sesión cancelada es un hueco, no una reserva, y
 * tratarla como ocupada bloquearía la agenda con horas que están libres.
 */
export function findOverlappingSessions(
  sessions: Session[],
  slot: ProposedSlot,
  options: OverlapOptions = {}
): Session[] {
  const start = toMinutes(slot.time)
  const end = start + slot.durationMinutes

  return sessions.filter((session) => {
    if (session.id === options.ignoreSessionId) return false
    if (session.status === 'cancelled') return false
    if (session.date !== slot.date) return false

    const sessionStart = toMinutes(session.time)
    const sessionEnd = sessionStart + session.durationMinutes

    // Intersección de intervalos medio abiertos: terminar a las 10:00 y empezar
    // a las 10:00 NO es un choque, es encadenar dos sesiones.
    return start < sessionEnd && sessionStart < end
  })
}

/**
 * Frase que nombra el choque, para decirlo igual en los tres formularios.
 *
 * Nombra la sesión y su tramo porque «ese hueco está ocupado» no le sirve a
 * nadie: lo que el entrenador necesita saber es CON QUÉ choca, para decidir si
 * mueve esto o aquello.
 */
export function describeOverlap(sessions: Session[]): string {
  const [first] = sessions
  if (first === undefined) return ''

  const tramo = `${first.time}–${addMinutes(first.time, first.durationMinutes)}`
  const resto = sessions.length - 1

  if (resto === 0) return `Choca con «${first.title}», de ${tramo}.`
  return `Choca con «${first.title}», de ${tramo}, y ${resto} más.`
}

/** `09:00` + 90 → `10:30`. */
function addMinutes(time: string, minutes: number): string {
  const total = toMinutes(time) + minutes
  const hours = Math.floor(total / 60) % 24
  return `${String(hours).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
