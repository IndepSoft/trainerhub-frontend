import { Check, Timer } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { BLOCK_METHOD_LABEL_KEY } from '@/shared/i18n/domainLabels'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { formatClock, formatKilos } from '../libs/session.utils'
import {
  expectedWorkSeconds,
  paceVerdict,
  repsVerdict,
  restVerdict,
  type PaceVerdict,
  type RepsVerdict,
  type RestVerdict,
} from '../libs/setPerformance'
import type { SetStep } from '../libs/setPlan'
import type { SessionPhase } from '../hooks/useGuidedStrengthSession'
import type { SetRecord } from '@/shared/domain/entities/session'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { SetWeightField } from './SetWeightField'

const REPS_VERDICT_KEY: Record<RepsVerdict, TranslationKey> = {
  below: 'liveSession.repsBelow',
  within: 'liveSession.repsWithin',
  above: 'liveSession.repsAbove',
}

const PACE_VERDICT_KEY: Record<PaceVerdict, TranslationKey> = {
  fast: 'liveSession.paceFast',
  onTarget: 'liveSession.paceOnTarget',
  slow: 'liveSession.paceSlow',
}

const REST_VERDICT_KEY: Record<RestVerdict, TranslationKey> = {
  short: 'liveSession.restShort',
  onTarget: 'liveSession.restOnTarget',
  long: 'liveSession.restLong',
}

/**
 * Sólo se enciende lo que se sale de lo pactado.
 *
 * Pintar también de verde lo que salió bien convertiría la pantalla en un
 * semáforo donde lo que reclama atención deja de destacar. Es el mismo criterio
 * que la insignia de cuota.
 */
const OFF_TARGET = 'text-ember'
const ON_TARGET = 'text-ink/45'

interface SetTrackerProps {
  step: SetStep
  phase: SessionPhase
  /** Segundos de la fase en curso: lo que lleva la serie, o el descanso. */
  phaseSeconds: number
  repsDone: number
  targetReps: number
  /** Kilos anotados en la serie en curso, o `null` si todavía ninguno. */
  weightKg: number | null
  /** Lo que se levantó la última vez en este ejercicio, si se sabe. */
  lastWeightKg: number | null
  exerciseName: string
  /** Qué viene después del descanso. `null` si ésta era la última. */
  nextStep: SetStep | null
  nextExerciseName: string
  /** La serie que se acaba de cerrar, para decir cómo salió. */
  lastRecord: SetRecord | null
  onMarkReps: (count: number) => void
  onSetWeight: (kilos: number | null) => void
  onAdjustWeight: (delta: number) => void
  onFinishSet: () => void
  onStartNextSet: () => void
}

/**
 * La serie en curso: su reloj, sus repeticiones y su cierre.
 *
 * ES UNA SOLA SERIE, NO LA RUTINA. Quien entrena tiene el teléfono en la mano
 * treinta segundos cada dos minutos, y en ese rato necesita tres cosas: qué
 * toca, cuánto lleva, y dar la serie por cerrada. Todo lo demás —el resto de
 * bloques, lo que queda por delante— es contexto y va debajo, más pequeño.
 *
 * LOS CÍRCULOS SON REPETICIONES, no series. Antes marcaban series hechas, que es
 * un dato que se sabe igual contando: si hay cuatro y llevas dos, llevas dos.
 * Las repeticiones sí son información nueva —una serie prescrita a 8-10 puede
 * salir a 7— y son lo que sólo sabe quien acaba de hacerla.
 *
 * Tocar el círculo N marca hasta el N. Diez toques por serie serían doscientos
 * en una sesión, y a la tercera nadie los da.
 */
export function SetTracker({
  step,
  phase,
  phaseSeconds,
  repsDone,
  targetReps,
  weightKg,
  lastWeightKg,
  exerciseName,
  nextStep,
  nextExerciseName,
  lastRecord,
  onMarkReps,
  onSetWeight,
  onAdjustWeight,
  onFinishSet,
  onStartNextSet,
}: SetTrackerProps) {
  const { t } = useTranslation()

  if (phase === 'rest') {
    const remaining = step.restSecondsAfter - phaseSeconds
    const overdue = remaining < 0
    // La serie que se acaba de cerrar es la de ESTE paso: el descanso pertenece
    // a la serie que lo provoco, no a la siguiente.
    const lastExpected = expectedWorkSeconds(step)

    return (
      <section className="shrink-0 border-y border-cobalt-tint-3 bg-cobalt-tint/40 px-5 py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cobalt">
          {t('liveSession.resting')}
        </p>

        {/* Cuenta ATRÁS, no adelante: lo que hace falta saber es cuánto queda.
            Pasado el prescrito la cifra sigue corriendo en positivo, para que un
            descanso de más se vea en vez de esconderse en un cero. */}
        <p
          className={cn(
            'metric-figures mt-1 font-display text-6xl font-extrabold leading-none tracking-tight',
            overdue ? 'text-ember' : 'text-ink'
          )}
        >
          {overdue ? '+' : ''}
          {formatClock(Math.abs(remaining))}
        </p>

        {/* Lo prescrito, sin veredicto: al segundo uno de un descanso de dos
            minutos, «corto» es trivialmente cierto. El juicio del descanso llega
            cuando termina, en la pantalla de la serie siguiente. */}
        <p className={cn('mt-1 text-xs', ON_TARGET)}>
          {t('liveSession.restOf', { seconds: step.restSecondsAfter })}
        </p>

        {lastRecord !== null && (
          <p className="mt-3 text-sm text-ink/60">
            {lastRecord.weightKg === undefined
              ? t('liveSession.setDone', {
                  reps: lastRecord.repsDone,
                  prescribed: lastRecord.prescribedReps,
                  seconds: lastRecord.workSeconds,
                })
              : t('liveSession.setDoneWithWeight', {
                  reps: lastRecord.repsDone,
                  prescribed: lastRecord.prescribedReps,
                  weight: formatKilos(lastRecord.weightKg),
                  seconds: lastRecord.workSeconds,
                })}
            {' · '}
            {t(PACE_VERDICT_KEY[paceVerdict(lastRecord.workSeconds, lastExpected)])}
          </p>
        )}

        {nextStep !== null && (
          <p className="mt-3 text-xs text-ink/45">
            {t('liveSession.nextUp', {
              exercise: nextExerciseName,
              set: nextStep.setNumber,
              total: nextStep.totalSets,
            })}
          </p>
        )}

        <Button className="mt-4 h-14 w-full gap-2" onClick={onStartNextSet}>
          <Timer className="size-5" />
          {t('liveSession.startNextSet')}
        </Button>
      </section>
    )
  }

  const expected = expectedWorkSeconds(step)
  const reps = repsVerdict(repsDone, step.reps)

  return (
    <section className="shrink-0 border-y border-cobalt-tint-3 px-5 py-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
        {t('liveSession.blockPosition', { position: step.blockPosition })} ·{' '}
        {t(BLOCK_METHOD_LABEL_KEY[step.blockMethod])}
      </p>

      <h2 className="mt-1 font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
        {exerciseName}
      </h2>

      <p className="metric-figures mt-1.5 text-sm text-ink/55">
        {t('liveSession.setOf', { set: step.setNumber, total: step.totalSets })} · {step.reps}
        {step.rir !== undefined && ` · RIR ${step.rir}`}
        {step.tempo !== undefined && ` · ${step.tempo}`}
      </p>

      {/* El reloj de LA SERIE, no el de la sesión: el de la sesión sigue en la
          cabecera y responde a otra pregunta. */}
      <p className="metric-figures mt-4 font-display text-6xl font-extrabold leading-none tracking-tight text-ink">
        {formatClock(phaseSeconds)}
      </p>
      {/* La previsión, SIN veredicto: a los tres segundos de empezar nadie va
          «rápido», va empezando. Juzgar una serie a mitad es lo que convierte un
          dato en un reproche. El veredicto llega al cerrarla, en el descanso. */}
      <p className={cn('mt-1 text-xs', ON_TARGET)}>
        {t('liveSession.expectedWork', { seconds: expected })}
      </p>

      {/* La serie anterior, ya cerrada y con su descanso medido. Aquí SÍ hay
          veredicto del descanso: ya ocurrió entero, así que decir que se acortó
          es un hecho y no una prisa. */}
      {lastRecord !== null && (
        <p
          className={cn(
            'mt-1 text-xs',
            restVerdict(lastRecord.restSeconds, lastRecord.prescribedRestSeconds) === 'onTarget'
              ? ON_TARGET
              : OFF_TARGET
          )}
        >
          {lastRecord.weightKg === undefined
            ? t('liveSession.previousSet', {
                reps: lastRecord.repsDone,
                prescribed: lastRecord.prescribedReps,
                rest: lastRecord.restSeconds,
              })
            : t('liveSession.previousSetWithWeight', {
                reps: lastRecord.repsDone,
                prescribed: lastRecord.prescribedReps,
                weight: formatKilos(lastRecord.weightKg),
                rest: lastRecord.restSeconds,
              })}
          {' · '}
          {t(
            REST_VERDICT_KEY[
              restVerdict(lastRecord.restSeconds, lastRecord.prescribedRestSeconds)
            ]
          )}
        </p>
      )}

      {/* El peso ANTES de las repeticiones: se decide al cargar la barra, y
          las repeticiones se marcan al terminar. Debajo obligaría a subir la
          vista con el ejercicio ya hecho. */}
      <div className="mt-5">
        <SetWeightField
          weightKg={weightKg}
          lastWeightKg={lastWeightKg}
          onChange={onSetWeight}
          onAdjust={onAdjustWeight}
        />
      </div>

      <div
        role="group"
        aria-label={t('liveSession.repsLabel')}
        className="mt-5 flex flex-wrap gap-2"
      >
        {Array.from({ length: targetReps }, (_, index) => index + 1).map((rep) => {
          const marked = rep <= repsDone

          return (
            <button
              key={rep}
              type="button"
              aria-pressed={marked}
              aria-label={t('liveSession.repNumber', { number: rep })}
              onClick={() => onMarkReps(rep)}
              className={cn(
                'flex size-11 items-center justify-center rounded-action border-2 text-sm font-bold transition-colors',
                marked
                  ? 'border-cobalt bg-cobalt text-white'
                  : 'border-cobalt-tint-3 text-ink/35 hover:border-cobalt/50'
              )}
            >
              {marked ? <Check className="size-4" strokeWidth={3} /> : rep}
            </button>
          )
        })}
      </div>

      <p
        className={cn(
          'mt-2 text-sm',
          repsDone === 0 ? 'text-ink/45' : reps === 'within' ? 'text-ink/60' : OFF_TARGET
        )}
      >
        {t('liveSession.repsDone', { done: repsDone, prescribed: step.reps })}
        {/* El veredicto sólo cuando hay algo que juzgar: con cero marcadas la
            serie no ha empezado, y decir «por debajo» ahí sería un reproche
            antes de tiempo. */}
        {repsDone > 0 && ` · ${t(REPS_VERDICT_KEY[reps])}`}
      </p>

      <Button className="mt-4 h-14 w-full gap-2" onClick={onFinishSet}>
        <Check className="size-5" />
        {t('liveSession.finishSet')}
      </Button>
    </section>
  )
}
