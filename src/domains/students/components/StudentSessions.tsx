import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useStudentSessions } from '../hooks/useStudentSessions'
import { groupSessions } from '../libs/groupSessions'
import type { Session, SessionStatus } from '@/shared/domain/entities/session'
import type { Student } from '@/shared/domain/entities/student'
import { isMissedSession } from '@/shared/domain/sessionLifecycle'
import { formatMonthOfDateKey, formatShortDateKey, todayKey } from '@/shared/lib/dateKey'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { SESSION_STATUS_LABEL_KEY } from '@/shared/i18n/domainLabels'

/* Solo el COLOR: el rotulo sale de `SESSION_STATUS_LABEL_KEY`, que es el mismo
   para las cuatro pantallas que lo enseñan. */
const STATUS_CLASS: Record<SessionStatus, string> = {
  pending: 'border-warning/50 text-warning',
  confirmed: 'border-success/50 text-success',
  completed: 'border-cobalt/50 text-cobalt',
  cancelled: 'border-danger/50 text-danger',
}

/** «No ocurrio»: abierta y con el dia pasado. Se deriva, no se guarda. */
const MISSED_CLASS = 'border-ink/25 text-ink/50 border-dashed'

interface StudentSessionsProps {
  student: Student
}

interface SessionGroupProps {
  title: string
  /** Lo que se dice a la derecha del título: cuántas, o cuántas hechas. */
  aside: string
  children: ReactNode
}

function SessionGroup({ title, aside, children }: SessionGroupProps) {
  return (
    <section className="flex flex-col">
      <div className="flex items-baseline justify-between gap-2 border-b border-cobalt-tint-3 pb-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          {title}
        </h2>
        <span className="metric-figures text-[13px] font-semibold text-cobalt">{aside}</span>
      </div>
      <ul>{children}</ul>
    </section>
  )
}

interface SessionItemProps {
  session: Session
  today: string
}

/**
 * Una sesión en una fila de 56 px: día, qué y cuándo, y su estado.
 *
 * Eran filas de tres líneas y 90 px; doce hacían 1.100 px. Lo hecho y lo
 * cancelado va atenuado —ya no pide nada—, y lo que no ocurrió no: es lo único
 * del pasado que el entrenador querría mirar dos veces.
 */
function SessionItem({ session, today }: SessionItemProps) {
  const { t } = useTranslation()
  const missed = isMissedSession(session, today)
  const settled = session.status === 'completed' || session.status === 'cancelled'

  return (
    <li
      className={cn(
        'grid min-h-14 grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-cobalt-tint-3 py-2',
        settled && 'opacity-60'
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">
        {formatShortDateKey(session.date)}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold text-ink">{session.title}</span>
        <span className="metric-figures truncate text-xs text-ink/60">
          {session.time} · {session.durationMinutes} min
          {session.location !== '' && ` · ${session.location}`}
        </span>
      </span>
      <span
        className={cn(
          'shrink-0 rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
          missed ? MISSED_CLASS : STATUS_CLASS[session.status]
        )}
      >
        {missed ? t('session.status.missed') : t(SESSION_STATUS_LABEL_KEY[session.status])}
      </span>
    </li>
  )
}

/**
 * Las sesiones de un alumno: lo próximo, y lo hecho por meses.
 *
 * Lo que se agenda aquí aparece en el calendario, y al revés, porque los dos
 * leen del mismo puerto y están suscritos a sus cambios. Ninguno de los dos
 * dominios importa nada del otro.
 */
export function StudentSessions({ student }: StudentSessionsProps) {
  const { t, plural } = useTranslation()
  const { sessions, loading } = useStudentSessions(student.id)
  const today = todayKey()
  const { upcoming, months } = useMemo(() => groupSessions(sessions, today), [sessions, today])

  return (
    <div className="flex flex-col gap-6 px-5 pb-8 pt-2">
      {/* Sin boton propio de agendar: la cabecera de la ficha ya tiene esa
          accion, y duplicarla dejaba dos botones identicos en la misma pagina. */}
      {loading ? null : sessions.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/40">
          {t('studentSessions.empty', { name: student.firstName })}
        </p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <SessionGroup title={t('studentSessions.upcoming')} aside={String(upcoming.length)}>
              {upcoming.map((session) => (
                <SessionItem key={session.id} session={session} today={today} />
              ))}
            </SessionGroup>
          )}

          {months.map((month) => (
            <SessionGroup
              key={month.monthKey}
              title={formatMonthOfDateKey(`${month.monthKey}-01`, today)}
              aside={plural(
                'studentSessions.doneCount.one',
                'studentSessions.doneCount.other',
                month.completedCount,
                { count: month.completedCount }
              )}
            >
              {month.sessions.map((session) => (
                <SessionItem key={session.id} session={session} today={today} />
              ))}
            </SessionGroup>
          ))}
        </>
      )}

      {/* Un enlace y no una copia de la agenda: desde aqui se ve lo de este
          alumno, y para ver el hueco que queda libre se va al calendario. */}
      <Link
        to="/calendar"
        className="inline-flex min-h-11 w-fit items-center gap-1 text-[13px] font-semibold text-cobalt underline-offset-4 hover:underline"
      >
        {t('studentSessions.viewCalendar')}
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  )
}
