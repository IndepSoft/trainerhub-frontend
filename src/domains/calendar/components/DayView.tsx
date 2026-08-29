import { TIME_SLOTS } from '../data/calendarOptions'
import { SessionCard } from './SessionCard'
import { cn } from '@/shared/lib/utils'
import type { Session } from '../types/calendar.types'

interface DayViewProps {
  date: Date
  getSessionsAt: (date: Date, time: string) => Session[]
  onSelectSession: (session: Session) => void
}

/**
 * Vista de día.
 *
 * Los tramos vacíos ocupan una sola línea fina. Antes cada uno era un bloque
 * con el mismo peso que uno ocupado y el texto «Sin sesiones programadas», así
 * que un día con dos sesiones exigía recorrer catorce bloques casi idénticos
 * para encontrarlas. Lo que se busca en una agenda es lo que SÍ hay.
 *
 * La hora va en cifras tabulares y ancho fijo: sin eso, «9:00» y «11:30» no
 * alinean y la columna deja de leerse como una escala de tiempo.
 */
export function DayView({ date, getSessionsAt, onSelectSession }: DayViewProps) {
  return (
    <ol className="divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
      {TIME_SLOTS.map((time) => {
        const sessions = getSessionsAt(date, time)
        const isEmpty = sessions.length === 0

        return (
          <li
            key={time}
            className={cn('flex gap-3 px-4', isEmpty ? 'py-2' : 'py-4')}
          >
            <span
              className={cn(
                'metric-figures w-11 shrink-0 pt-0.5 text-sm font-semibold tabular-nums',
                isEmpty ? 'text-ink/25' : 'text-cobalt'
              )}
            >
              {time}
            </span>

            {isEmpty ? (
              // Una regla en vez de una frase: comunica «libre» sin gastar una
              // linea de texto por cada tramo vacio del dia.
              <span aria-hidden="true" className="mt-2.5 h-px flex-1 bg-cobalt-tint-2" />
            ) : (
              // `min-w-0` obligatorio: `flex-1` da `flex-basis: 0`, pero el
              // `min-width: auto` por defecto impide encoger por debajo del
              // contenido. Sin esto el bloque de sesion medía 366 px dentro de un
              // hueco de 277 y se salia por la derecha.
              <div className="min-w-0 flex-1 space-y-2">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onSelect={onSelectSession}
                  />
                ))}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
