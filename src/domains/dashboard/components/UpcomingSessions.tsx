import { Timeline, TimelineEntry } from '@/shared/components/Timeline'
import { SectionHeading } from './SectionHeading'
import { SessionItem } from './SessionItem'
import type { Session } from '../types/dashboard.types'

interface UpcomingSessionsProps {
  sessions: Session[]
}

/**
 * Seccion, no tarjeta. Las sesiones cuelgan de una unica linea vertical en vez
 * de apilar una caja por sesion: el orden temporal se lee de un vistazo, que es
 * justo lo que una lista de cajas iguales no comunica.
 */
export function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
  return (
    <section className="flex-1">
      <SectionHeading count={sessions.length}>Próximas sesiones</SectionHeading>

      <div className="pt-5">
        <Timeline>
          {sessions.map((session, index) => (
            <TimelineEntry
              key={session.id}
              stamp={session.scheduledDate}
              state={index === 0 ? 'active' : 'pending'}
              isLast={index === sessions.length - 1}
            >
              <SessionItem session={session} />
            </TimelineEntry>
          ))}
        </Timeline>
      </div>
    </section>
  )
}
