import { MetricStrip } from '@/shared/components/MetricStrip'
import { MetricFigure } from '@/shared/components/MetricFigure'
import { ageOf, type Student } from '@/shared/domain/entities/student'
import { goalLabel } from '@/shared/i18n/domainLabels'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useStudentSummary } from '../hooks/useStudentSummary'
import { StudentAssignments } from './StudentAssignments'
import { StudentUpNext } from './StudentUpNext'

interface StudentSummaryProps {
  student: Student
  /**
   * Dónde se está pintando.
   *
   * `section` es la primera sección de la ficha, a todo el ancho de la
   * pantalla. `column` es la columna de identidad de escritorio, de 380 px:
   * ahí las cuatro cifras no caben en una fila —«Edad» quedaba en «2…»— y van
   * de dos en dos.
   */
  placement?: 'section' | 'column'
}

/**
 * La primera sección de la ficha: cómo está, qué tiene asignado y qué le toca.
 *
 * Responde lo que se pregunta al abrir una ficha, en ese orden. Antes la ficha
 * era una sola página de más de cuatro mil píxeles con todo abierto, y lo que
 * pedía atención —una cuota vencida, un hito por validar— quedaba a mitad de
 * recorrido, entre formularios. Aquí está a la primera pantalla, y el detalle
 * de cada cosa en su sección.
 */
export function StudentSummary({ student, placement = 'section' }: StudentSummaryProps) {
  const { t } = useTranslation()
  const summary = useStudentSummary(student.id)

  return (
    <div>
      <MetricStrip columns={placement === 'column' ? 2 : 4} className="mx-5 mt-2">
        {/* Sin fecha se dice «—», no cero: nadie tiene cero años. */}
        <MetricFigure
          label={t('studentCard.age')}
          value={ageOf(student.birthDate)}
          unit={t('studentCard.years')}
        />
        <MetricFigure
          label={t('studentDetail.bodyFat')}
          value={student.bodyFatPercentage}
          unit="%"
        />
        <MetricFigure
          label={t('studentSummary.sessions')}
          value={summary.completedSessions}
          unit={t('studentSummary.sessionsUnit')}
        />
        <MetricFigure
          label={t('studentSummary.streak')}
          value={summary.streakDays}
          unit={t('studentSummary.streakUnit')}
        />
      </MetricStrip>

      {student.goals.length > 0 && (
        <section className="px-5 pt-8" aria-labelledby="objetivos-titulo">
          <h2
            id="objetivos-titulo"
            className="mb-4 border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
          >
            {t('studentDetail.goals')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {student.goals.map((goal) => (
              <span
                key={goal}
                className="inline-flex h-8 items-center rounded-action border border-cobalt-tint-3 bg-surface px-3 text-[13px] text-ink"
              >
                {goalLabel(goal, t)}
              </span>
            ))}
          </div>
        </section>
      )}

      <StudentAssignments student={student} />

      <StudentUpNext
        student={student}
        nextSession={summary.loading ? undefined : summary.nextSession}
        awaitingMilestone={summary.awaitingMilestone}
        pendingBadgeCount={summary.pendingBadgeCount}
        flaggedCount={summary.flaggedCount}
      />
    </div>
  )
}
