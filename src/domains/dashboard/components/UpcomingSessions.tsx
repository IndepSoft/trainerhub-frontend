import { Link } from 'react-router-dom'
import { Timeline, TimelineEntry } from '@/shared/components/Timeline'
import { SectionHeading } from './SectionHeading'
import { SessionItem } from './SessionItem'
import { formatStamp } from '../libs/dashboardTime'
import type { UpcomingSession } from '../types/dashboard.types'

interface UpcomingSessionsProps {
  sessions: UpcomingSession[]
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

      {sessions.length === 0 && (
        <p className="pt-5 text-sm text-ink/40">
          No hay nada agendado a partir de hoy.
        </p>
      )}

      <div className="pt-5">
        <Timeline>
          {sessions.map(({ session, studentName }, index) => (
            <TimelineEntry
              key={session.id}
              stamp={`${formatStamp(session.date)} · ${session.time}`}
              state={index === 0 ? 'active' : 'pending'}
              isLast={index === sessions.length - 1}
            >
              {/* Solo la proxima sesion abre la pantalla en vivo: es la unica
                  que se puede empezar ahora. Las demas se pintan igual pero no
                  son accionables, para que el enlace signifique algo. */}
              {index === 0 ? (
                <Link
                  to={`/session/${session.id}`}
                  className="block rounded-sm outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt-lift"
                >
                  <SessionItem session={session} studentName={studentName} />
                </Link>
              ) : (
                <SessionItem session={session} studentName={studentName} />
              )}
            </TimelineEntry>
          ))}
        </Timeline>
      </div>
    </section>
  )
}
