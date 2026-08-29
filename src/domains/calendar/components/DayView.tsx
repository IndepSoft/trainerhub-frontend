import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Clock, MapPin } from 'lucide-react'
import { TIME_SLOTS } from '../data/calendarOptions'
import { getStudentInitials } from '../libs/calendar.utils'
import { SESSION_STATUS } from '../libs/sessionStatus'
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
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onSelectSession(session)}
                    className={cn(
                      'w-full rounded-block border p-3 text-left transition-colors',
                      SESSION_STATUS[session.status].slotClassName
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/*
                        El AvatarImage apuntaba a /generic-placeholder-icon.png,
                        que no existe en public/ y devolvia 404 en cada sesion
                        pintada. Se deja solo el fallback con las iniciales.
                      */}
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-white/70 text-xs font-semibold">
                          {getStudentInitials(session.student)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold leading-tight">
                          {session.title}
                        </p>

                        <p className="metric-figures mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-80">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {session.durationMinutes} min
                          </span>
                          <span className="flex min-w-0 items-center gap-1">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{session.location}</span>
                          </span>
                          <span className="uppercase tracking-wider">
                            {session.kind === 'individual' ? 'Individual' : 'Grupal'}
                          </span>
                        </p>
                      </div>

                      <span className="shrink-0 pt-0.5">
                        {SESSION_STATUS[session.status].icon}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
