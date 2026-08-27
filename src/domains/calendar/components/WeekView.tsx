import { TIME_SLOTS, WEEK_DAY_LABELS } from '../data/calendarOptions'
import { isToday, toLocalDateKey } from '../libs/calendar.utils'
import { SESSION_STATUS } from '../libs/sessionStatus'
import type { Session } from '../types/calendar.types'

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
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelectSession(session)}
                  className={`w-full text-left p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                    SESSION_STATUS[session.status].slotClassName
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {SESSION_STATUS[session.status].icon}
                    <span className="font-medium truncate">
                      {session.student}
                    </span>
                  </div>
                  <div className="text-xs opacity-75">{session.category}</div>
                </button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
