import { countDeloadWeeks, countPlanSessions } from '../libs/plan.utils'
import type { TrainingPlan } from '../types/training.types'

interface PlanDraftSummaryProps {
  /** El plan tal y como quedaría si se guardase ahora. */
  plan: TrainingPlan
}

/**
 * Lo que el plan mide mientras se escribe. Sólo presentación.
 *
 * Las cifras son DERIVADAS, con las mismas funciones que usa la tarjeta. Es lo
 * que garantiza que las sesiones que el entrenador cuenta aquí sean las que
 * verá después en la lista.
 */
export function PlanDraftSummary({ plan }: PlanDraftSummaryProps) {
  const deloadWeeks = countDeloadWeeks(plan)

  return (
    <dl className="grid grid-cols-1 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className="flex flex-col gap-2 px-5 py-5">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          Semanas
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
          Sesiones
        </dt>
        <dd className="metric-figures font-display text-3xl font-extrabold leading-none text-ink">
          {countPlanSessions(plan)}
        </dd>
      </div>

      <div className="flex flex-col gap-2 px-5 py-5">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          Frecuencia
        </dt>
        <dd className="metric-figures font-display text-3xl font-extrabold leading-none text-ink">
          {plan.weeklyFrequency}
          <span className="ml-1 text-lg font-bold text-ink/45">/sem</span>
        </dd>
      </div>
    </dl>
  )
}
