import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { LEVEL_BADGE } from '../libs/levelBadge'
import { countDeloadWeeks, countPlanSessions } from '../libs/plan.utils'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import type { TrainingPlan } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { catalogLabel, STUDENT_LEVEL_LABEL_KEY } from '@/shared/i18n/domainLabels'

interface PlanCardProps {
  plan: TrainingPlan
}

/**
 * Tarjeta de plan, compacta como la de rutina y por lo mismo: las dos viven en
 * la misma pantalla y una alta al lado de una baja se lee como dos listas.
 *
 * Lo que queda es lo que distingue un mesociclo de otro —cuánto dura, cuánto
 * trabajo tiene dentro, con qué frecuencia y para qué—; la descripción, las
 * semanas y el detalle son de la ficha. Sin rótulo «PLAN» encima, por lo mismo
 * que la de rutina: la pestaña en la que está ya lo dice.
 *
 * El enlace es estirado —`after:absolute after:inset-0`— para que toda la
 * tarjeta sea el objetivo táctil y no sólo el título, igual que en la de rutina.
 */
export function PlanCard({ plan }: PlanCardProps) {
  const { t, plural } = useTranslation()
  const { objectivesById, splitsById } = useTrainingCatalog()

  const objective = objectivesById.get(plan.objectiveId)
  const split = splitsById.get(plan.splitId)
  const deloadWeeks = countDeloadWeeks(plan)
  const sessions = countPlanSessions(plan)

  return (
    <article className="group relative flex flex-col gap-2 rounded-block border border-cobalt-tint-3 bg-surface p-4 transition-colors hover:border-cobalt/40 focus-within:border-cobalt">
      <h3 className="min-w-0 font-display text-[1.375rem] font-extrabold uppercase leading-none tracking-tight text-ink">
        <Link
          to={`/trainings/plans/${plan.id}`}
          className="flex min-h-11 items-center outline-none after:absolute after:inset-0 focus-visible:underline"
        >
          {plan.title}
        </Link>
      </h3>

      <p className="text-[13px] text-ink/60">
        {plural('plan.weekCount.one', 'plan.weekCount.other', plan.weeks.length, {
          count: plan.weeks.length,
        })}
        {' · '}
        {plural('plan.sessionCount.one', 'plan.sessionCount.other', sessions, {
          count: sessions,
        })}
        {` · ${plan.weeklyFrequency}${t('plan.perWeek')}`}
        {/* La descarga sólo se nombra si la hay: «0 de descarga» es ruido. */}
        {deloadWeeks > 0 && ` · ${t('plan.deloadCount', { count: deloadWeeks })}`}
      </p>

      {/* Para qué es y cómo reparte la semana: es lo que se compara entre dos
          planes al elegir uno. */}
      <p className="truncate text-[13px] text-ink/85">
        {objective === undefined
          ? t('plan.noObjective')
          : catalogLabel(objective.id, objective.name, t)}
        {' · '}
        {split === undefined ? t('plan.noSplit') : catalogLabel(split.id, split.name, t)}
      </p>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span
          className={cn(
            'rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
            LEVEL_BADGE[plan.level]
          )}
        >
          {t(STUDENT_LEVEL_LABEL_KEY[plan.level])}
        </span>
      </div>
    </article>
  )
}
