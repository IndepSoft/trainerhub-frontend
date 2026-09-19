import type { Session } from '@/shared/domain/entities/session'

/** Una sesión del día, en su sitio. */
interface AgendaSessionEntry {
  kind: 'session'
  session: Session
}

/** El hueco entre dos sesiones, contado en una línea. */
interface AgendaGapEntry {
  kind: 'gap'
  /** La hora a la que vuelve a haber algo, `HH:mm`. */
  until: string
}

export type AgendaEntry = AgendaSessionEntry | AgendaGapEntry

/**
 * A partir de cuánto hueco se dice que el día está libre, en minutos.
 *
 * Dos horas, y no media: entre una sesión y la siguiente hay huecos de veinte
 * minutos que son el propio descanso del entrenador, y anunciarlos llenaría el
 * día de líneas que no dicen nada. Dos horas ya es un tramo en el que cabe otra
 * sesión, que es la decisión que esta línea informa.
 */
const GAP_MINUTES = 120

/**
 * El día como lista: sus sesiones en orden, con los huecos contados.
 *
 * LA ALTERNATIVA ERA LA REJILLA, y sigue estando —«Horario»—, pero no puede ser
 * lo único: de 08:00 a 21:00 son veintisiete tramos, casi todos vacíos, y en un
 * teléfono eso reparte tres sesiones en más de 2.000 px de desplazamiento. La
 * lista enseña el día entero de un vistazo y dice en una línea lo que la
 * rejilla dice con setecientos píxeles en blanco.
 *
 * El hueco se mide ENTRE FILAS, y una cancelada es una fila: se ve que estaba y
 * que no va a ocurrir, y su insignia lo dice. Descontarla del hueco haría que
 * la línea prometiera un rato libre con una fila dentro.
 */
export function dayAgenda(sessions: Session[], gapMinutes: number = GAP_MINUTES): AgendaEntry[] {
  const inOrder = [...sessions].sort((first, second) => first.time.localeCompare(second.time))
  const entries: AgendaEntry[] = []

  for (const [index, session] of inOrder.entries()) {
    const previous = inOrder[index - 1]

    if (previous !== undefined) {
      const freeFrom = minutesOf(previous.time) + previous.durationMinutes
      if (minutesOf(session.time) - freeFrom >= gapMinutes) {
        entries.push({ kind: 'gap', until: session.time })
      }
    }

    entries.push({ kind: 'session', session })
  }

  return entries
}

/** `09:30` → 570. La hora local de la sesión, en minutos desde medianoche. */
function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
