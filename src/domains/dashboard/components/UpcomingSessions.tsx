import { Link } from 'react-router-dom'
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
              {/* Solo la proxima sesion abre la pantalla en vivo: es la unica
                  que se puede empezar ahora. Las demas se pintan igual pero no
                  son accionables, para que el enlace signifique algo. */}
              {index === 0 ? (
                <Link
                  to="/session"
                  className="block rounded-sm outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt-lift"
                >
                  <SessionItem session={session} />
                </Link>
              ) : (
                <SessionItem session={session} />
              )}
            </TimelineEntry>
          ))}
        </Timeline>
      </div>
    </section>
  )
}
