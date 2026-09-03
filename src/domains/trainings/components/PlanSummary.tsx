import { countDeloadWeeks, countPlanSessions } from '../libs/plan.utils'
import type { TrainingPlan } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

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
 */
export function PlanSummary({ plan }: PlanSummaryProps) {
  const { t } = useTranslation()
  const deloadWeeks = countDeloadWeeks(plan)

  return (
    <dl className="grid grid-cols-1 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className="flex flex-col gap-2 px-5 py-5">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          {t('plan.weeks')}
        </dt>
        {/*
          La descarga va en su PROPIA LINEA. Al lado de la cifra de semanas se
          leia «21»: dos numeros seguidos en la misma tipografia numerica se
          funden en uno aunque haya margen entre ellos.
        */}
        <dd>
          <span className="metric-figures block font-display text-3xl font-extrabold leading-none text-ink">
            {plan.weeks.length}
          </span>
          {deloadWeeks > 0 && (
            <span className="metric-figures mt-1.5 block text-xs font-semibold text-ink/45">
              {deloadWeeks} de descarga
            </span>
          )}
        </dd>
      </div>

      <div className="flex flex-col gap-2 px-5 py-5">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          {t('plan.sessions')}
        </dt>
        <dd className="metric-figures font-display text-3xl font-extrabold leading-none text-ink">
          {countPlanSessions(plan)}
        </dd>
      </div>

      <div className="flex flex-col gap-2 px-5 py-5">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          {t('plan.frequency')}
        </dt>
        <dd className="metric-figures font-display text-3xl font-extrabold leading-none text-ink">
          {plan.weeklyFrequency}
          <span className="ml-1 text-lg font-bold text-ink/45">/sem</span>
        </dd>
      </div>
    </dl>
  )
}
