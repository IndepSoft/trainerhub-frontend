import { MetricStrip } from '@/shared/components/MetricStrip'
import { MetricFigure } from '@/shared/components/MetricFigure'
import { countDeloadWeeks, countPlanSessions } from '../libs/plan.utils'
import type { TrainingPlan } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { STUDENT_LEVEL_LABEL_KEY } from '@/shared/i18n/domainLabels'

interface PlanSummaryProps {
  plan: TrainingPlan
}

/**
 * Lo que mide un plan. Sólo presentación.
 *
 * La usan la ficha y el formulario, y por eso ya no se llama `PlanDraftSummary`:
 * recibe un plan, le da igual si está guardado o a medio escribir. Que sea la
 * misma pieza es lo que garantiza que las cifras que el entrenador ve mientras
 * escribe sean exactamente las que verá después.
 *
 * Las cifras son DERIVADAS, con las mismas funciones que usa la tarjeta.
 *
 * EN FRANJA DE DOS POR DOS, no apiladas: eran tres filas de 90 px cada una
 * antes de llegar a las semanas, que son el plan. El nivel entra en la franja,
 * donde se lee como una cifra más, en vez de en un bloque aparte.
 */
export function PlanSummary({ plan }: PlanSummaryProps) {
  const { t } = useTranslation()
  const deloadWeeks = countDeloadWeeks(plan)

  return (
    <MetricStrip columns={4} className="mx-5 mt-2">
      {/*
        La descarga va como UNIDAD, en su tipografía de texto. Al lado de la
        cifra de semanas y en la misma tipografía numérica se leía «21»: dos
        números seguidos se funden en uno aunque haya margen entre ellos.
      */}
      <MetricFigure
        label={t('plan.weeks')}
        value={plan.weeks.length}
        unit={deloadWeeks > 0 ? t('plan.deloadCount', { count: deloadWeeks }) : undefined}
      />
      <MetricFigure label={t('plan.sessions')} value={countPlanSessions(plan)} />
      <MetricFigure
        label={t('plan.frequency')}
        value={plan.weeklyFrequency}
        unit={t('plan.perWeek')}
      />
      <MetricFigure label={t('routine.level')} value={t(STUDENT_LEVEL_LABEL_KEY[plan.level])} />
    </MetricStrip>
  )
}
