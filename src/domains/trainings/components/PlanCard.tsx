import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarRange } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { LEVEL_BADGE } from '../libs/levelBadge'
import { countDeloadWeeks, countPlanSessions } from '../libs/plan.utils'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import type { TrainingPlan } from '../types/training.types'

interface PlanCardProps {
  plan: TrainingPlan
}

/**
 * Tarjeta de plan, en el mismo registro editorial que la de rutina.
 *
 * Lleva a la ficha del plan, donde se lee; editar es una acción de dentro.
 *
 * El enlace es estirado —`after:absolute after:inset-0`— para que toda la
 * tarjeta sea el objetivo táctil y no sólo el título, igual que en la de rutina.
 */
export function PlanCard({ plan }: PlanCardProps) {
  const { objectivesById, splitsById } = useTrainingCatalog()

  const objective = objectivesById.get(plan.objectiveId)
  const split = splitsById.get(plan.splitId)
  const deloadWeeks = countDeloadWeeks(plan)

  return (
    <article className="group relative isolate flex flex-col overflow-hidden rounded-block border border-cobalt-tint-3 bg-surface transition-colors hover:border-cobalt/40 focus-within:border-cobalt">
      <div
        aria-hidden="true"
        className="absolute inset-x-[-15%] top-[13%] -z-10 h-[5.5rem] bg-cobalt-tint-2 transition-transform duration-300 group-hover:-translate-y-0.5"
        style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 60%, 0 100%)' }}
      />

      <div className="p-5 pb-0">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">
          <CalendarRange className="size-3.5" />
          Plan
        </span>
      </div>

      <h3 className="mt-2 px-5 font-display text-[1.75rem] font-extrabold uppercase leading-[0.94] tracking-tight text-ink">
        <Link
          to={`/trainings/plans/${plan.id}`}
          className="outline-none after:absolute after:inset-0 focus-visible:underline"
        >
          {plan.title}
        </Link>
      </h3>

      <p className="mt-2 px-5 text-sm text-ink/50">{plan.description}</p>

      {/* Las tres cifras que definen un mesociclo: cuánto dura, cuánto trabajo
          tiene dentro y con qué frecuencia se toca cada músculo. */}
      <dl className="mt-5 grid grid-cols-3 divide-x divide-cobalt-tint-3 border-y border-cobalt-tint-3">
        <div className="px-4 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
            Semanas
          </dt>
          <dd className="metric-figures font-display text-xl font-bold text-ink">
            {plan.weeks.length}
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
            Sesiones
          </dt>
          <dd className="metric-figures font-display text-xl font-bold text-ink">
            {countPlanSessions(plan)}
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
            Frecuencia
          </dt>
          <dd className="metric-figures font-display text-xl font-bold text-ink">
            {plan.weeklyFrequency}
            <span className="ml-1 text-xs font-semibold text-ink/40">/sem</span>
          </dd>
        </div>
      </dl>

      <dl className="space-y-2 px-5 py-4 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink/45">Objetivo</dt>
          <dd className="min-w-0 truncate text-end text-ink/70">
            {objective?.name ?? 'Sin objetivo'}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink/45">División</dt>
          <dd className="min-w-0 truncate text-end text-ink/70">{split?.name ?? 'Sin división'}</dd>
        </div>
        {deloadWeeks > 0 && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink/45">Descarga</dt>
            <dd className="metric-figures text-end text-ink/70">
              {deloadWeeks} {deloadWeeks === 1 ? 'semana' : 'semanas'}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex items-center gap-2 px-5 pb-5">
        <span
          className={cn(
            'rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
            LEVEL_BADGE[plan.level]
          )}
        >
          {plan.level}
        </span>

        <ArrowUpRight
          aria-hidden="true"
          className="ms-auto size-5 text-ink/25 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember"
        />
      </div>
    </article>
  )
}
