import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { SectionHeading } from './SectionHeading'
import { usePendingWork, type PendingWork } from '@/shared/hooks/usePendingWork'
import { useTranslation, type LanguageContextValue, type Translate } from '@/shared/i18n/LanguageContext'

interface PendingWorkSectionProps {
  /** Sólo para quien gestiona: un alumno no tiene bandeja. */
  enabled: boolean
}

interface PendingRow {
  id: string
  label: string
  /** A dónde se va a resolverlo. */
  to: string
}

/**
 * La bandeja: lo que espera una decisión del entrenador, con la puerta a cada
 * cosa. Es la pieza que convierte «tengo que ir a mirar» en «esto es lo que
 * hay». Cuando no hay nada se dice, en vez de esconder la sección: que la
 * bandeja esté vacía es una noticia.
 */
export function PendingWorkSection({ enabled }: PendingWorkSectionProps) {
  const { t, plural } = useTranslation()
  const work = usePendingWork(enabled)

  if (!enabled || work.loading) return null

  const rows = rowsFrom(work, t, plural)

  return (
    <section>
      <SectionHeading count={work.total}>{t('dashboard.pending')}</SectionHeading>
      <p className="pt-2 text-xs text-ink/45">{t('dashboard.pendingHint')}</p>

      {rows.length === 0 ? (
        <p className="pt-5 text-sm text-ink/40">{t('dashboard.pendingEmpty')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                to={row.to}
                className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm text-ink transition-colors hover:text-cobalt"
              >
                <span>{row.label}</span>
                <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-ink/30" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * Una fila por clase de trabajo, y cuando la clase es de UN alumno concreto,
 * una fila por alumno con su nombre: «Ver a María» lleva a su ficha, que es
 * donde se valida, se confirma o se revisa.
 */
function rowsFrom(
  work: PendingWork,
  t: Translate,
  plural: LanguageContextValue['plural']
): PendingRow[] {
  const rows: PendingRow[] = []

  if (work.requests.length > 0) {
    rows.push({
      id: 'requests',
      label: plural('pending.requests.one', 'pending.requests.other', work.requests.length, {
        count: work.requests.length,
      }),
      to: '/crew',
    })
  }

  // Por alumno: cuantos hitos, insignias y cargas esperan en su ficha.
  const perStudent = new Map<string, { milestones: number; badges: number; loads: number }>()
  const tally = (studentId: string, field: 'milestones' | 'badges' | 'loads') => {
    const current = perStudent.get(studentId) ?? { milestones: 0, badges: 0, loads: 0 }
    perStudent.set(studentId, { ...current, [field]: current[field] + 1 })
  }
  for (const milestone of work.milestones) tally(milestone.studentId, 'milestones')
  for (const badge of work.badges) tally(badge.studentId, 'badges')
  for (const score of work.flagged) tally(score.studentId, 'loads')

  for (const [studentId, counts] of perStudent) {
    const parts: string[] = []
    if (counts.milestones > 0) {
      parts.push(plural('pending.milestones.one', 'pending.milestones.other', counts.milestones, { count: counts.milestones }))
    }
    if (counts.badges > 0) {
      parts.push(plural('pending.badges.one', 'pending.badges.other', counts.badges, { count: counts.badges }))
    }
    if (counts.loads > 0) {
      parts.push(plural('pending.loads.one', 'pending.loads.other', counts.loads, { count: counts.loads }))
    }
    rows.push({
      id: `student-${studentId}`,
      label: `${t('pending.seeStudent', { name: nameOf(studentId, work) })} · ${parts.join(', ')}`,
      to: `/students/${studentId}`,
    })
  }

  if (work.overdue.length > 0) {
    rows.push({
      id: 'overdue',
      label: plural('pending.dues.one', 'pending.dues.other', work.overdue.length, {
        count: work.overdue.length,
      }),
      to: '/reports',
    })
  }

  if (work.noAccount.length > 0) {
    rows.push({
      id: 'no-account',
      label: plural('pending.noAccount.one', 'pending.noAccount.other', work.noAccount.length, {
        count: work.noAccount.length,
      }),
      to: '/students',
    })
  }

  return rows
}

/** El nombre del alumno. Sin ficha -no debería pasar- su identificador corto. */
function nameOf(studentId: string, work: PendingWork): string {
  const known = work.students.find((student) => student.id === studentId)
  return known === undefined ? studentId.slice(0, 8) : known.firstName
}
