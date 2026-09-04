import { Lock } from 'lucide-react'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import {
  catalogDescription,
  catalogEnumLabel,
  catalogLabel,
} from '@/shared/i18n/domainLabels'

/**
 * Las cuatro tablas que el entrenador NO edita.
 *
 * No es una limitación de la implementación: es la decisión. Grupos musculares y
 * patrones de movimiento son vocabulario compartido, y abrirlos a texto libre
 * **rompe todo lo que se cuenta con ellos**: en cuanto un entrenador escribe
 * «Pecho» y otro «Pectoral», contar series por grupo muscular deja de significar
 * nada y equilibrar una sesión por patrón deja de ser posible. Objetivos y
 * divisiones vienen de la literatura de fuerza, no de la preferencia de cada uno.
 *
 * Se muestran igualmente porque el entrenador tiene que poder consultar con qué
 * vocabulario está clasificando, y porque una lista que existe y no se ve acaba
 * siendo una lista que nadie sabe que existe.
 */
export function ReferenceCatalog() {
  const { t } = useTranslation()
  const { muscleGroupsById, movementPatternsById, objectivesById, splitsById } =
    useTrainingCatalog()

  const muscleGroups = [...muscleGroupsById.values()]
  const regions = [...new Set(muscleGroups.map((muscleGroup) => muscleGroup.region))]

  return (
    <section className="space-y-8 px-4 pb-6">
      <p className="flex items-start gap-2 rounded-block border border-cobalt-tint-3 bg-cobalt-tint px-4 py-3 text-sm text-ink/60">
        <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cobalt" />
        {t('reference.locked')}
      </p>

      <div>
        <h3 className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          {t('reference.muscleGroups')}
        </h3>
        <dl className="divide-y divide-cobalt-tint-3">
          {regions.map((region) => (
            <div key={region} className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-ink/45">
                {catalogEnumLabel(region, t)}
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {muscleGroups
                  .filter((muscleGroup) => muscleGroup.region === region)
                  .map((muscleGroup) => (
                    <span
                      key={muscleGroup.id}
                      className="rounded-action border border-cobalt-tint-3 px-2.5 py-1 text-xs text-ink/70"
                    >
                      {catalogLabel(muscleGroup.id, muscleGroup.name, t)}
                    </span>
                  ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h3 className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          {t('reference.movementPatterns')}
        </h3>
        <div className="flex flex-wrap gap-2 pt-4">
          {[...movementPatternsById.values()].map((pattern) => (
            <span
              key={pattern.id}
              className="rounded-action border border-cobalt-tint-3 px-2.5 py-1 text-xs text-ink/70"
            >
              {catalogLabel(pattern.id, pattern.name, t)}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          {t('reference.objectives')}
        </h3>
        <dl className="divide-y divide-cobalt-tint-3">
          {[...objectivesById.values()].map((objective) => (
            <div key={objective.id} className="py-4">
              <dt className="font-semibold text-ink">{catalogLabel(objective.id, objective.name, t)}</dt>
              <dd className="mt-0.5 text-sm text-ink/50">
                {catalogDescription(objective.id, objective.description, t)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h3 className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          {t('reference.splits')}
        </h3>
        <dl className="divide-y divide-cobalt-tint-3">
          {[...splitsById.values()].map((split) => (
            <div key={split.id} className="py-4">
              <dt className="flex items-baseline justify-between gap-4 font-semibold text-ink">
                {catalogLabel(split.id, split.name, t)}
                <span className="metric-figures shrink-0 text-xs font-normal text-ink/45">
                  {t('reference.sessionsPerWeek', { count: split.sessionsPerWeek })}
                </span>
              </dt>
              <dd className="mt-0.5 text-sm text-ink/50">
                {catalogDescription(split.id, split.description, t)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
