import { CalendarRange, Copy } from 'lucide-react'
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
 * NO ES NAVEGABLE, y por eso no lleva flecha de destino ni enlace estirado: no
 * existe todavía una ficha de plan. Una tarjeta que se comporta como un enlace y
 * no lleva a ningún sitio es peor que una que no lo aparenta.
 *
 * La marca «Plantilla» va en la propia tarjeta y no en una pestaña aparte, al
 * revés que en rutinas. Con una sola pestaña de planes la distinción sigue
 * siendo visible, y una sexta pestaña —«plantillas de plan»— no cabría en la
 * barra a 375 px.
 *
 * TODO: falta la ficha de plan y falta poder crearlo. Esta vista sólo lee lo
 * que el modelo ya describe.
 */
export function PlanCard({ plan }: PlanCardProps) {
  const { objectivesById, splitsById } = useTrainingCatalog()

  const objective = objectivesById.get(plan.objectiveId)
  const split = splitsById.get(plan.splitId)
  const deloadWeeks = countDeloadWeeks(plan)

  return (
    <article className="relative isolate flex flex-col overflow-hidden rounded-block border border-cobalt-tint-3 bg-white">
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-x-[-15%] top-[13%] -z-10 h-[5.5rem]',
          plan.isTemplate ? 'bg-ember/25' : 'bg-cobalt-tint-2'
        )}
        style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 60%, 0 100%)' }}
      />

      <div className="p-5 pb-0">
        <span
          className={cn(
            'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em]',
            plan.isTemplate ? 'text-ember-deep' : 'text-ink/45'
          )}
        >
          {plan.isTemplate ? (
            <Copy className="size-3.5" />
          ) : (
            <CalendarRange className="size-3.5" />
          )}
          {plan.isTemplate ? 'Plantilla de plan' : 'Plan'}
        </span>
      </div>

      <h3 className="mt-2 px-5 font-display text-[1.75rem] font-extrabold uppercase leading-[0.94] tracking-tight text-ink">
        {plan.title}
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
      </div>
    </article>
  )
}
