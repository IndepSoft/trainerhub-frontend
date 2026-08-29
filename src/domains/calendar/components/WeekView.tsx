import { TIME_SLOTS, WEEK_DAY_LABELS } from '../data/calendarOptions'
import { isToday, toLocalDateKey } from '../libs/calendar.utils'
import { SESSION_STATUS } from '../libs/sessionStatus'
import type { Session } from '../types/calendar.types'
import { cn } from '@/shared/lib/utils'

interface WeekViewProps {
  weekDates: Date[]
  getSessionsAt: (date: Date, time: string) => Session[]
  onSelectSession: (session: Session) => void
}

export function WeekView({
  weekDates,
  getSessionsAt,
  onSelectSession,
}: WeekViewProps) {
  return (
    <div className="grid grid-cols-8 gap-1">
      <div className="p-2" />

      {weekDates.map((date, index) => (
        <div key={toLocalDateKey(date)} className="p-2 text-center border-b">
          <div className="font-medium">{WEEK_DAY_LABELS[index]}</div>
          <div
            className={`text-sm ${
              isToday(date) ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
          >
            {date.getDate()}
          </div>
        </div>
      ))}

      {TIME_SLOTS.map((time) => (
        <div key={time} className="contents">
          <div className="p-2 text-sm text-muted-foreground border-r">
            {time}
          </div>

          {weekDates.map((date) => (
            <div
              key={`${toLocalDateKey(date)}-${time}`}
              className="p-1 border-b border-r min-h-16"
            >
              {getSessionsAt(date, time).map((session) => (
                /*
                 * Es la MISMA tarjeta que en la vista de dia, comprimida: misma
                 * superficie blanca, mismo canto del sistema, misma cuna con el
                 * color del estado y la misma respuesta al pasar por encima. Lo
                 * unico que cambia es la escala; el contenido sigue siendo el
                 * minimo que cabe en una celda de rejilla semanal.
                 *
                 * El canto antes no existia: `slotClassName` traia
                 * `border-success/30` y equivalentes, pero sin clase de grosor
                 * el borde nunca llego a pintarse. Se declaraba un color de
                 * canto invisible.
                 */
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelectSession(session)}
                  className="group relative isolate w-full overflow-hidden rounded-block border border-cobalt-tint-3 bg-white p-2 text-left text-xs transition-colors hover:border-cobalt/40"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-[-20%] top-[24%] -z-10 h-7 transition-transform duration-300 group-hover:-translate-y-0.5',
                      SESSION_STATUS[session.status].accentClassName
                    )}
                    style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 60%, 0 100%)' }}
                  />

                  <div className="mb-0.5 flex items-center gap-1">
                    <span
                      className={
                        SESSION_STATUS[session.status].outlineBadgeClassName.split(' ')[1]
                      }
                    >
                      {SESSION_STATUS[session.status].icon}
                    </span>
                    <span className="truncate font-display font-bold uppercase tracking-tight text-ink">
                      {session.student}
                    </span>
                  </div>
                  <div className="truncate text-[10px] uppercase tracking-wider text-ink/45">
                    {session.category}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
