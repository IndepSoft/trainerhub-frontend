import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { formatPrescription, formatRest } from '@/shared/lib/routineFormat'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useSessionExercises } from '../hooks/useSessionExercises'
import { SessionDuration } from './SessionDuration'
import { SlideToAction } from './SlideToAction'
import { useStrengthSession } from '../hooks/useStrengthSession'
import type { Routine } from '@/shared/domain/entities/routine'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import type { Session, SessionResult } from '@/shared/domain/entities/session'
import { BLOCK_METHOD_LABEL_KEY } from '@/shared/i18n/domainLabels'

interface StrengthSessionProps {
  session: Session
  /** La rutina que ejecuta, o `null` si la sesión no tiene ninguna. */
  routine: Routine | null
  studentName: string
  onFinish: (result: SessionResult) => void
}

/**
 * Sesión de fuerza en marcha.
 *
 * La pantalla en vivo que había medía distancia, ritmo y trazado de GPS: era una
 * salida a correr. Todo lo que compone este proyecto —bloques, superseries, RIR,
 * tempo, descansos— es entrenamiento de sala, y no tenía dónde ejecutarse. Ésta
 * es esa pantalla; la de cardio sigue existiendo, para las sesiones que sí lo
 * son.
 *
 * EL AVANCE SE MIDE EN SERIES, que es la unidad en la que se programa. Cada
 * serie es un objetivo táctil de 44 px: se marca con el pulgar, entre serie y
 * serie, y con el teléfono en la mano.
 */
export function StrengthSession({
  session,
  routine,
  studentName,
  onFinish,
}: StrengthSessionProps) {
  const { t } = useTranslation()
  const exercisesById = useSessionExercises()
  const {
    elapsedSeconds,
    state,
    doneByExercise,
    doneSets,
    totalSets,
    progress,
    markSet,
    unmarkSet,
    pause,
    resume,
  } = useStrengthSession(routine)

  const isRunning = state === 'running'

  /*
   * Al cerrar se anota lo hecho: series marcadas sobre prescritas y el tiempo
   * real. `doneSets` puede quedar por debajo de `totalSets` y esta bien -una
   * sesion se puede terminar sin completarla entera-; guardar los dos numeros
   * es lo que permite distinguirlo despues.
   */
  const handleFinish = () => {
    onFinish({
      completedSets: doneSets,
      totalSets,
      elapsedSeconds,
      completedAt: toLocalDateKey(new Date()),
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <header className="shrink-0 px-5 pt-5 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
          {studentName}
        </p>
        <h1 className="truncate font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
          {routine?.title ?? session.title}
        </h1>
      </header>

      <SessionDuration elapsedSeconds={elapsedSeconds} state={state} />

      {/* El avance, en series y no en porcentaje: «12 de 18» dice cuánto queda;
          «67 %» obliga a hacer la cuenta al revés. */}
      <div className="shrink-0 border-y border-cobalt-tint-3 px-5 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
            {t('liveSession.sets')}
          </span>
          <span className="metric-figures font-display text-xl font-bold text-ink">
            {doneSets}
            <span className="text-sm font-semibold text-ink/40"> / {totalSets}</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalSets}
          aria-valuenow={doneSets}
          aria-label={t('liveSession.setsDone')}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-cobalt-tint-2"
        >
          <div
            className="h-full rounded-full bg-cobalt transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {routine === null ? (
          <p className="px-5 py-12 text-center text-sm text-ink/40">
            {t('liveSession.noRoutine')}
          </p>
        ) : (
          <ol className="divide-y divide-cobalt-tint-3">
            {routine.blocks.map((block, index) => (
              <li key={block.id} className="px-5 py-5">
                <div className="flex items-baseline gap-3">
                  <span className="metric-figures w-6 shrink-0 text-sm font-bold text-cobalt">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'rounded-action border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                      block.method === 'simple'
                        ? 'border-cobalt-tint-3 text-ink/45'
                        : 'border-ember/40 text-ember-deep'
                    )}
                  >
                    {t(BLOCK_METHOD_LABEL_KEY[block.method])}
                  </span>
                  <span className="metric-figures ms-auto shrink-0 text-xs text-ink/40">
                    {t('liveSession.blockRest', { rest: formatRest(block.restAfterSeconds) })}
                  </span>
                </div>

                <ul className="mt-3 space-y-4">
                  {block.exercises.map((prescribed) => {
                    const done = doneByExercise.get(prescribed.id) ?? 0

                    return (
                      <li key={prescribed.id}>
                        <div className="flex items-baseline justify-between gap-4 text-sm">
                          <span className="min-w-0 flex-1 truncate text-ink">
                            {exercisesById.get(prescribed.exerciseId)?.name ?? t('liveSession.exercise')}
                          </span>
                          <span className="metric-figures shrink-0 font-semibold text-ink/55">
                            {formatPrescription(prescribed)}
                          </span>
                        </div>

                        {/*
                          Una casilla por serie. Marcar avanza; volver a pulsar
                          la ultima desmarca, porque equivocarse contando series
                          es lo mas normal del mundo y no puede costar reiniciar.
                        */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Array.from({ length: prescribed.sets }, (_, setIndex) => {
                            const isDone = setIndex < done
                            const isLastDone = setIndex === done - 1

                            return (
                              <button
                                key={setIndex}
                                type="button"
                                aria-pressed={isDone}
                                aria-label={t('liveSession.setNumberOf', {
                                  number: setIndex + 1,
                                  total: prescribed.sets,
                                })}
                                onClick={() =>
                                  isLastDone
                                    ? unmarkSet(prescribed.id)
                                    : markSet(prescribed.id, prescribed.sets)
                                }
                                className={cn(
                                  'inline-flex size-11 items-center justify-center rounded-action border text-sm font-bold transition-colors',
                                  isDone
                                    ? 'border-cobalt bg-cobalt text-white'
                                    : 'border-cobalt-tint-3 text-ink/35 hover:border-cobalt/40'
                                )}
                              >
                                {isDone ? <Check className="size-4" /> : setIndex + 1}
                              </button>
                            )
                          })}
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {block.notes !== undefined && (
                  <p className="mt-3 ps-9 text-xs text-ink/40">{block.notes}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* El margen de zona segura va aqui y no en cada franja: con dos apiladas,
          aplicarlo a ambas dejaria un hueco entre ellas. */}
      <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {!isRunning && (
          <SlideToAction
            variant="finish"
            label={t('liveSession.slideToFinish')}
            accessibleLabel={t('liveSession.finish')}
            onConfirm={handleFinish}
          />
        )}

        <SlideToAction
          label={isRunning ? t('liveSession.slideToPause') : t('liveSession.slideToResume')}
          accessibleLabel={isRunning ? t('liveSession.pause') : t('liveSession.resume')}
          onConfirm={isRunning ? pause : resume}
        />
      </div>
    </div>
  )
}
