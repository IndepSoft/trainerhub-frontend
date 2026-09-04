import { TIME_SLOTS } from '../data/calendarOptions'
import type { Session } from '../types/calendar.types'

/**
 * Geometría de las sesiones sobre la escala de tiempo. Funciones puras.
 *
 * Vive aparte de `calendar.utils`, que se ocupa de fechas: esto es colocación en
 * una escala, y mezclarlas dejaría un módulo con dos responsabilidades.
 */

/** `HH:mm` a minutos desde medianoche. */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Los límites de la escala salen de `TIME_SLOTS`, no escritos a mano.
 *
 * Si mañana la agenda empieza a las 07:00 o los tramos pasan a 15 minutos, la
 * geometría se ajusta sola. Escribir 08:00 y 21:00 aquí crearía una segunda
 * fuente de verdad que habría que recordar mantener.
 */
export const SCALE_START_MINUTES = parseTimeToMinutes(TIME_SLOTS[0])

export const SLOT_MINUTES =
  parseTimeToMinutes(TIME_SLOTS[1]) - parseTimeToMinutes(TIME_SLOTS[0])

/** El último tramo también ocupa su duración, de ahí el `+ SLOT_MINUTES`. */
export const SCALE_END_MINUTES =
  parseTimeToMinutes(TIME_SLOTS[TIME_SLOTS.length - 1]) + SLOT_MINUTES

const SCALE_TOTAL_MINUTES = SCALE_END_MINUTES - SCALE_START_MINUTES

export interface SessionPlacement {
  /** Distancia desde el inicio de la escala, de 0 a 1. */
  topRatio: number
  /** Altura como fracción de la escala, de 0 a 1. */
  heightRatio: number
  /** Columna que ocupa cuando se solapa con otras. */
  laneIndex: number
  /** Cuántas columnas hay en su grupo de solape. */
  laneCount: number
  /** La sesión empieza antes de que arranque la escala visible. */
  clippedStart: boolean
  /** La sesión termina después de que acabe la escala visible. */
  clippedEnd: boolean
}

/** Altura mínima para que una sesión corta siga siendo legible y pulsable. */
const MINIMUM_HEIGHT_RATIO = (SLOT_MINUTES * 0.75) / SCALE_TOTAL_MINUTES

interface SessionInterval {
  session: Session
  start: number
  end: number
}

function toInterval(session: Session): SessionInterval {
  const start = parseTimeToMinutes(session.time)
  return { session, start, end: start + session.durationMinutes }
}

/**
 * Reparte en columnas las sesiones que se solapan en el tiempo.
 *
 * Sin esto, dos sesiones a la misma hora se pintarían una encima de otra y la
 * de abajo sería invisible: no es un detalle estético, es un dato que
 * desaparece. Los datos simulados no tienen solapes hoy, pero una agenda real
 * los tiene en cuanto hay clases grupales.
 *
 * El reparto es por grupos: sólo compiten por el ancho las sesiones que
 * realmente se pisan entre sí, así que una sesión suelta a las 18:00 sigue
 * ocupando el ancho completo aunque a las 9:00 hubiera tres solapadas.
 */
function assignLanes(intervals: SessionInterval[]): Map<string, { index: number; count: number }> {
  const ordered = [...intervals].sort((a, b) => a.start - b.start || a.end - b.end)
  const lanes = new Map<string, { index: number; count: number }>()

  let group: SessionInterval[] = []
  let groupEnd = -Infinity

  const flushGroup = () => {
    if (group.length === 0) return

    // Asignación voraz: cada sesión toma la primera columna libre en su
    // instante de inicio.
    const columnEnds: number[] = []
    const assigned: Array<{ id: string; index: number }> = []

    for (const interval of group) {
      let column = columnEnds.findIndex((end) => end <= interval.start)
      if (column === -1) {
        column = columnEnds.length
        columnEnds.push(interval.end)
      } else {
        columnEnds[column] = interval.end
      }
      assigned.push({ id: interval.session.id, index: column })
    }

    for (const { id, index } of assigned) {
      lanes.set(id, { index, count: columnEnds.length })
    }
    group = []
    groupEnd = -Infinity
  }

  for (const interval of ordered) {
    if (interval.start >= groupEnd) flushGroup()
    group.push(interval)
    groupEnd = Math.max(groupEnd, interval.end)
  }
  flushGroup()

  return lanes
}

/**
 * Coloca las sesiones de un día sobre la escala.
 *
 * Las que se salen de la escala visible se recortan en vez de desaparecer, y se
 * marcan con `clippedStart` / `clippedEnd` para que la vista pueda señalarlo:
 * una sesión que existe y no se ve es peor que una que se ve a medias.
 */
export function placeSessions(
  sessions: Session[]
): Array<{ session: Session; placement: SessionPlacement }> {
  const intervals = sessions.map(toInterval)
  const lanes = assignLanes(intervals)

  return intervals
    .filter((interval) => interval.end > SCALE_START_MINUTES && interval.start < SCALE_END_MINUTES)
    .map((interval) => {
      const visibleStart = Math.max(interval.start, SCALE_START_MINUTES)
      const visibleEnd = Math.min(interval.end, SCALE_END_MINUTES)
      const lane = lanes.get(interval.session.id) ?? { index: 0, count: 1 }

      return {
        session: interval.session,
        placement: {
          topRatio: (visibleStart - SCALE_START_MINUTES) / SCALE_TOTAL_MINUTES,
          heightRatio: Math.max(
            (visibleEnd - visibleStart) / SCALE_TOTAL_MINUTES,
            MINIMUM_HEIGHT_RATIO
          ),
          laneIndex: lane.index,
          laneCount: lane.count,
          clippedStart: interval.start < SCALE_START_MINUTES,
          clippedEnd: interval.end > SCALE_END_MINUTES,
        },
      }
    })
}
