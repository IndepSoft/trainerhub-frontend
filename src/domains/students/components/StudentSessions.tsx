import { Link } from 'react-router-dom'
import { Clock, MapPin } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useStudentSessions } from '../hooks/useStudentSessions'
import { formatDateKey } from '../libs/dateKey'
import type { SessionStatus } from '@/shared/domain/entities/session'
import type { Student } from '@/shared/domain/entities/student'

/** Presentación de cada estado. Los mismos tres que usa la agenda. */
const STATUS_BADGE: Record<SessionStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'border-warning/50 text-warning' },
  confirmed: { label: 'Confirmada', className: 'border-success/50 text-success' },
  completed: { label: 'Completada', className: 'border-cobalt/50 text-cobalt' },
  cancelled: { label: 'Cancelada', className: 'border-danger/50 text-danger' },
}

interface StudentSessionsProps {
  student: Student
}

/**
 * Las sesiones de un alumno.
 *
 * Es lo que faltaba para que la asignación existiera: hasta ahora una sesión
 * guardaba el NOMBRE del alumno en texto, así que no había forma de preguntar
 * «qué tiene María esta semana» sin comparar cadenas. Con `studentId` la
 * pregunta se le hace al puerto.
 *
 * Lo que se agenda aquí aparece en el calendario, y al revés, porque los dos
 * leen del mismo puerto y están suscritos a sus cambios. Ninguno de los dos
 * dominios importa nada del otro.
 */
export function StudentSessions({ student }: StudentSessionsProps) {
  const { sessions, loading } = useStudentSessions(student.id)

  return (
    <section className="px-5 py-8">
      {/* Sin boton propio de agendar: la cabecera de la ficha ya tiene esa
          accion, y duplicarla dejaba dos botones identicos en la misma pagina
          -uno de ellos, ademas, el que llevaba meses sin conectar-. */}
      <h2 className="mb-4 border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
        Sesiones
      </h2>

      {loading ? null : sessions.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/40">
          {student.firstName} no tiene sesiones agendadas.
        </p>
      ) : (
        <ul className="divide-y divide-cobalt-tint-3">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-start gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{session.title}</p>
                <p className="metric-figures mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/45">
                  <span>{formatDateKey(session.date)}</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {session.time} · {session.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {session.location}
                  </span>
                </p>
              </div>

              <span
                className={cn(
                  'shrink-0 rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                  STATUS_BADGE[session.status].className
                )}
              >
                {STATUS_BADGE[session.status].label}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Un enlace y no una copia de la agenda: desde aqui se ve lo de este
          alumno, y para ver el hueco que queda libre se va al calendario. */}
      <Link
        to="/calendar"
        className="mt-4 inline-flex h-11 items-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45 transition-colors hover:text-cobalt"
      >
        Ver la agenda completa
      </Link>
    </section>
  )
}
