import { Link } from 'react-router-dom'
import { CalendarRange, Dumbbell } from 'lucide-react'
import { useAssignedRepertoire } from '../hooks/useAssignedRepertoire'
import { formatDateKey } from '@/shared/lib/dateKey'
import type { Assignment } from '@/shared/domain/entities/assignment'
import { useTranslation, type Translate } from '@/shared/i18n/LanguageContext'

interface AssignedRepertoireProps {
  studentId: string
}

/**
 * El repertorio del alumno: los planes y las rutinas que le han asignado.
 *
 * Sólo lectura, con enlace a la ficha de cada cosa, que ahora se abre a los
 * miembros del equipo. Agendar sigue siendo del entrenador: aquí se ve qué
 * hay, no se pone en la agenda.
 */
export function AssignedRepertoire({ studentId }: AssignedRepertoireProps) {
  const { t } = useTranslation()
  const { entries, loading } = useAssignedRepertoire(studentId)

  if (loading) return null

  return (
    <section className="space-y-4 px-4 pt-6">
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          {t('progress.assigned')}
        </h2>
        <p className="mt-1 text-xs text-ink/45">{t('progress.assignedHint')}</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-ink/40">{t('progress.assignedEmpty')}</p>
      ) : (
        <ul className="divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
          {entries.map(({ assignment, title }) => (
            <li key={assignment.id} className="py-3">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">
                {assignment.kind === 'plan' ? (
                  <CalendarRange className="size-3.5" />
                ) : (
                  <Dumbbell className="size-3.5" />
                )}
                {assignment.kind === 'plan' ? t('assign.plan') : t('assign.routine')}
              </span>
              {title === null ? (
                <p className="mt-1 flex min-h-11 items-center font-semibold text-ink/45">
                  {t('assignments.gone')}
                </p>
              ) : (
                <Link
                  to={destinationOf(assignment)}
                  className="mt-1 flex min-h-11 items-center font-semibold text-ink underline-offset-4 hover:text-cobalt hover:underline"
                >
                  {title}
                </Link>
              )}
              <p className="text-xs text-ink/45">{describeWhen(assignment, t)}</p>
              {assignment.notes !== '' && <p className="mt-1 text-xs text-ink/40">{assignment.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function destinationOf(assignment: Assignment): string {
  return assignment.kind === 'plan'
    ? `/trainings/plans/${assignment.planId}`
    : `/trainings/${assignment.routineId}`
}

/** Las mismas frases que ve el entrenador en la ficha: el alumno lee lo mismo. */
function describeWhen(assignment: Assignment, t: Translate): string {
  if (assignment.kind === 'routine') {
    return t('assignments.routineOn', { date: formatDateKey(assignment.assignedOn) })
  }
  if (assignment.startDate === null) return t('assignments.noStart')
  return t('assignments.startsOn', { date: formatDateKey(assignment.startDate) })
}
