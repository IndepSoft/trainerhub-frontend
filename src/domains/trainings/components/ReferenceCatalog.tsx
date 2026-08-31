import { Lock } from 'lucide-react'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'

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
  const { muscleGroupsById, movementPatternsById, objectivesById, splitsById } =
    useTrainingCatalog()

  const muscleGroups = [...muscleGroupsById.values()]
  const regions = [...new Set(muscleGroups.map((muscleGroup) => muscleGroup.region))]

  return (
    <section className="space-y-8 px-4 pb-6">
      <p className="flex items-start gap-2 rounded-block border border-cobalt-tint-3 bg-cobalt-tint px-4 py-3 text-sm text-ink/60">
        <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cobalt" />
        Estas tablas no se editan. Son el vocabulario con el que se clasifica y se
        cuenta: si cada entrenador lo escribiera a su manera, filtrar por grupo
        muscular o equilibrar por patrón dejaría de funcionar.
      </p>

      <div>
        <h3 className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          Grupos musculares
        </h3>
        <dl className="divide-y divide-cobalt-tint-3">
          {regions.map((region) => (
            <div key={region} className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-ink/45">
                {region}
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {muscleGroups
                  .filter((muscleGroup) => muscleGroup.region === region)
                  .map((muscleGroup) => (
                    <span
                      key={muscleGroup.id}
                      className="rounded-action border border-cobalt-tint-3 px-2.5 py-1 text-xs text-ink/70"
                    >
                      {muscleGroup.name}
                    </span>
                  ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h3 className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          Patrones de movimiento
        </h3>
        <div className="flex flex-wrap gap-2 pt-4">
          {[...movementPatternsById.values()].map((pattern) => (
            <span
              key={pattern.id}
              className="rounded-action border border-cobalt-tint-3 px-2.5 py-1 text-xs text-ink/70"
            >
              {pattern.name}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          Objetivos
        </h3>
        <dl className="divide-y divide-cobalt-tint-3">
          {[...objectivesById.values()].map((objective) => (
            <div key={objective.id} className="py-4">
              <dt className="font-semibold text-ink">{objective.name}</dt>
              <dd className="mt-0.5 text-sm text-ink/50">{objective.description}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h3 className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          Divisiones
        </h3>
        <dl className="divide-y divide-cobalt-tint-3">
          {[...splitsById.values()].map((split) => (
            <div key={split.id} className="py-4">
              <dt className="flex items-baseline justify-between gap-4 font-semibold text-ink">
                {split.name}
                <span className="metric-figures shrink-0 text-xs font-normal text-ink/45">
                  {split.sessionsPerWeek} sesiones/sem
                </span>
              </dt>
              <dd className="mt-0.5 text-sm text-ink/50">{split.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
