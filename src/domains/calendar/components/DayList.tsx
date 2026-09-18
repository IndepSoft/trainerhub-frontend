import type { ReactNode } from 'react'
import { ListRow } from '@/shared/components/ListRow'
import { cn } from '@/shared/lib/utils'
import { todayKey } from '@/shared/lib/dateKey'
import { dayAgenda } from '../libs/dayAgenda'
import { presentationOf } from '../libs/sessionStatus'
import { resolveSessionStudentName } from '../libs/sessionStudent'
import type { Student } from '@/shared/domain/entities/student'
import type { Session } from '../types/calendar.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface DayListProps {
  date: Date
  /**
   * Qué se enseña cuando el día no tiene nada. Lo compone la página, que es
   * quien sabe agendar y quien sabe si hoy es hoy.
   */
  empty: ReactNode
  getSessionsOfDay: (date: Date) => Session[]
  onSelectSession: (session: Session) => void
  /** Alumnos indexados, para resolver el nombre de cada sesion una sola vez. */
  studentsById: Map<string, Student>
}

/**
 * El día como lista de filas, que es como se ve por defecto.
 *
 * Cada fila dice lo que hace falta para decidir si abrirla: a qué hora, con
 * quién, de qué y en qué estado. La hora va en una columna estrecha, como en la
 * rejilla, para que la vista siga leyéndose de arriba abajo por horas.
 *
 * El nombre accesible es el MISMO que el de la tarjeta de la rejilla
 * —`session.card.label`—: las dos vistas enseñan la misma sesión, y quien la
 * busca por voz no tiene por qué saber en cuál está.
 */
export function DayList({
  date,
  empty,
  getSessionsOfDay,
  onSelectSession,
  studentsById,
}: DayListProps) {
  const { t } = useTranslation()
  const entries = dayAgenda(getSessionsOfDay(date))

  if (entries.length === 0) return <div className="px-5">{empty}</div>

  return (
    <ul className="px-5">
      {entries.map((entry) => {
        if (entry.kind === 'gap') {
          return (
            <li
              key={`libre-${entry.until}`}
              className="flex min-h-9 items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/60"
            >
              <span aria-hidden="true" className="h-px flex-1 bg-cobalt-tint-3" />
              {t('calendar.freeUntil', { time: entry.until })}
              <span aria-hidden="true" className="h-px flex-1 bg-cobalt-tint-3" />
            </li>
          )
        }

        const { session } = entry
        const studentName = resolveSessionStudentName(session, studentsById, t)
        const status = presentationOf(session, todayKey())

        return (
          <ListRow
            key={session.id}
            primary={studentName}
            /*
             * LOS MINUTOS PRIMERO, y no el título: la línea se trunca a 375 px
             * y lo que se pierde por la derecha tiene que ser lo menos
             * decisivo. Cuánto dura es lo que, con la hora de la izquierda,
             * dice qué tramo ocupa.
             */
            secondary={`${session.durationMinutes} min · ${session.title} · ${session.location}`}
            onSelect={() => onSelectSession(session)}
            label={t('session.card.label', {
              title: session.title,
              student: studentName,
              status: t(status.labelKey),
              time: session.time,
              minutes: session.durationMinutes,
            })}
            leading={
              <span className="metric-figures w-12 shrink-0 font-display text-lg font-extrabold leading-none text-ink">
                {session.time}
              </span>
            }
            trailing={
              <span
                className={cn(
                  'shrink-0 rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]',
                  status.outlineBadgeClassName
                )}
              >
                {t(status.labelKey)}
              </span>
            }
          />
        )
      })}
    </ul>
  )
}
