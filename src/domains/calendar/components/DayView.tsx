import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Clock, MapPin } from 'lucide-react'
import { TIME_SLOTS } from '../data/calendarOptions'
import { getStudentInitials } from '../libs/calendar.utils'
import { SESSION_STATUS } from '../libs/sessionStatus'
import type { Session } from '../types/calendar.types'

interface DayViewProps {
  date: Date
  getSessionsAt: (date: Date, time: string) => Session[]
  onSelectSession: (session: Session) => void
}

export function DayView({ date, getSessionsAt, onSelectSession }: DayViewProps) {
  return (
    <div className="space-y-4">
      {TIME_SLOTS.map((time) => {
        const sessions = getSessionsAt(date, time)

        return (
          <div key={time} className="flex gap-4 p-4 border-b">
            <div className="w-16 text-sm text-muted-foreground font-medium">
              {time}
            </div>
            <div className="flex-1">
              {sessions.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  Sin sesiones programadas
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => onSelectSession(session)}
                      className={`w-full text-left p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                        SESSION_STATUS[session.status].slotClassName
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/*
                            El AvatarImage apuntaba a
                            /generic-placeholder-icon.png, que no existe en
                            public/ y devolvia 404 en cada sesion pintada. Se
                            deja solo el fallback con las iniciales hasta que
                            haya fotos reales.
                          */}
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {getStudentInitials(session.student)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{session.title}</h3>
                            <div className="flex items-center gap-4 text-sm opacity-75 mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {session.durationMinutes} min
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {session.location}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {SESSION_STATUS[session.status].icon}
                          <Badge variant="outline" className="text-xs">
                            {session.kind === 'individual' ? 'Individual' : 'Grupal'}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
