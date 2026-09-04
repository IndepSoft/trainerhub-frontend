import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { BLOCK_METHOD_LABEL_KEY } from '@/shared/i18n/domainLabels'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { SetStep } from '../libs/setPlan'
import type { Exercise } from '@/shared/domain/entities/exercise'
import { formatKilos } from '../libs/session.utils'
import type { SetRecord } from '@/shared/domain/entities/session'

interface SessionPlanListProps {
  steps: SetStep[]
  currentIndex: number
  exercisesById: Map<string, Exercise>
  /** Las series ya cerradas, para decir qué se hizo en vez de qué tocaba. */
  records: SetRecord[]
}

/**
 * Lo que queda por delante, en pequeño.
 *
 * ES CONTEXTO, NO EL PROTAGONISTA. La pantalla anterior era exactamente esta
 * lista y nada más, y por eso no acompañaba: quien entrena mira el teléfono
 * treinta segundos entre serie y serie, y en ese rato lo que necesita es la
 * serie que está haciendo. Saber qué viene después es útil —para preparar el
 * material, para decidir si le da tiempo— y por eso sigue estando, debajo.
 *
 * Se agrupa por BLOQUE porque es la unidad que se prepara: una superserie exige
 * tener las dos máquinas libres a la vez, y verla partida en series sueltas
 * escondería justo eso.
 */
export function SessionPlanList({
  steps,
  currentIndex,
  exercisesById,
  records,
}: SessionPlanListProps) {
  const { t } = useTranslation()

  const doneById = new Map(records.map((record) => [record.stepId, record]))

  /**
   * Lo hecho si ya se hizo, y lo prescrito si todavía no.
   *
   * Es la diferencia entre un plan y un diario. Una serie cerrada a 62,5 kg y
   * siete repeticiones ya no necesita decir «6-8»: eso era lo que tocaba, y lo
   * que interesa mirar hacia atrás es lo que salió.
   */
  const describe = (step: SetStep): string => {
    const record = doneById.get(step.id)
    if (record === undefined) {
      return `${t('liveSession.setOf', { set: step.setNumber, total: step.totalSets })} · ${step.reps}`
    }

    return record.weightKg === undefined
      ? t('liveSession.doneReps', { reps: record.repsDone })
      : t('liveSession.doneRepsWithWeight', {
          reps: record.repsDone,
          weight: formatKilos(record.weightKg),
        })
  }

  const blocks = steps.reduce<Map<string, SetStep[]>>((groups, step) => {
    const current = groups.get(step.blockId) ?? []
    groups.set(step.blockId, [...current, step])
    return groups
  }, new Map())

  return (
    <section className="pb-6">
      <h2 className="px-5 pb-3 pt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
        {t('liveSession.plan')}
      </h2>

      <ol className="divide-y divide-cobalt-tint-3 border-t border-cobalt-tint-3">
        {[...blocks.values()].map((blockSteps) => {
          const head = blockSteps[0]

          return (
            <li key={head.blockId} className="px-5 py-4">
              <div className="flex items-baseline gap-3">
                <span className="metric-figures w-6 shrink-0 text-sm font-bold text-cobalt">
                  {String(head.blockPosition).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'rounded-action border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                    head.blockMethod === 'simple'
                      ? 'border-cobalt-tint-3 text-ink/45'
                      : 'border-ember/40 text-ember-deep'
                  )}
                >
                  {t(BLOCK_METHOD_LABEL_KEY[head.blockMethod])}
                </span>
              </div>

              <ul className="mt-2 space-y-1.5 ps-9">
                {blockSteps.map((step) => {
                  const position = steps.indexOf(step)
                  const done = position < currentIndex
                  const current = position === currentIndex

                  return (
                    <li
                      key={step.id}
                      aria-current={current ? 'step' : undefined}
                      className={cn(
                        'flex items-baseline gap-2 text-sm',
                        done && 'text-ink/35',
                        current && 'font-semibold text-cobalt',
                        !done && !current && 'text-ink/60'
                      )}
                    >
                      {done ? (
                        <Check aria-hidden="true" className="size-3.5 shrink-0 text-success" />
                      ) : (
                        <span aria-hidden="true" className="w-3.5 shrink-0" />
                      )}

                      <span className="min-w-0 flex-1 truncate">
                        {exercisesById.get(step.exerciseId)?.name ?? t('exercise.fallback')}
                      </span>

                      <span className="metric-figures shrink-0 text-xs">{describe(step)}</span>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
