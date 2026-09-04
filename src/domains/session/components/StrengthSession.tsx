import { useTranslation } from '@/shared/i18n/LanguageContext'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import { useSessionExercises } from '../hooks/useSessionExercises'
import { useGuidedStrengthSession } from '../hooks/useGuidedStrengthSession'
import { SessionDuration } from './SessionDuration'
import { SessionPlanList } from './SessionPlanList'
import { SetTracker } from './SetTracker'
import { SlideToAction } from './SlideToAction'
import { formatDuration } from '../libs/session.utils'
import type { Routine } from '@/shared/domain/entities/routine'
import type { Session, SessionResult } from '@/shared/domain/entities/session'
import { useLastWeights } from '../hooks/useLastWeights'

interface StrengthSessionProps {
  session: Session
  /** La rutina que ejecuta, o `null` si la sesión no tiene ninguna. */
  routine: Routine | null
  studentName: string
  onFinish: (result: SessionResult) => void
}

/**
 * Sesión de fuerza en marcha, GUIADA serie a serie.
 *
 * ERA UNA LISTA DE MARCADORES. Pintaba la rutina entera con una casilla por
 * serie: servía para recordar lo que tocaba y para contar cuántas llevabas, que
 * es un dato que se sabe igual mirando. No acompañaba mientras se entrena, y no
 * producía ninguna medida.
 *
 * Ahora la sesión sabe EN QUÉ SERIE VA. La serie en curso tiene su propio reloj
 * y se cierra a mano; al cerrarla arranca el descanso con el suyo, en cuenta
 * atrás sobre el prescrito. De ahí salen tres medidas por serie —repeticiones
 * hechas, segundos de trabajo, segundos de descanso reales— que se contrastan
 * con lo que la prescripción dice.
 *
 * LOS CÍRCULOS SON REPETICIONES. Antes eran series, y ése era el error de fondo:
 * las series ya las cuenta la propia sesión. Lo que sólo sabe quien está debajo
 * de la barra es cuántas repeticiones le salieron.
 */
export function StrengthSession({
  session,
  routine,
  studentName,
  onFinish,
}: StrengthSessionProps) {
  const { t } = useTranslation()
  const exercisesById = useSessionExercises()
  /*
   * Lo que se levanto la ultima vez en cada ejercicio. Llega aparte y sin
   * bloquear: si la consulta tarda, la pantalla se pinta igual y el campo del
   * peso arranca vacio, que es lo mismo que pasa en la primera sesion de
   * alguien.
   */
  const lastWeights = useLastWeights(session.studentId)
  const {
    steps,
    currentIndex,
    currentStep,
    phase,
    state,
    elapsedSeconds,
    phaseSeconds,
    repsDone,
    weightKg,
    targetReps,
    records,
    doneSets,
    totalSets,
    progress,
    markReps,
    setWeight,
    adjustWeight,
    finishSet,
    startNextSet,
    pause,
    resume,
  } = useGuidedStrengthSession(routine, lastWeights)

  const isRunning = state === 'running'
  const hasPlan = steps.length > 0
  const nextStep = steps[currentIndex + 1] ?? null
  const lastRecord = records[records.length - 1] ?? null

  const nameOf = (exerciseId: string | undefined) =>
    exerciseId === undefined
      ? t('exercise.fallback')
      : (exercisesById.get(exerciseId)?.name ?? t('exercise.fallback'))

  /*
   * Al cerrar se anota lo hecho. `sets` lleva cada serie medida; `completedSets`
   * y `totalSets` se conservan porque son lo que leen las reglas de progreso, y
   * cambiarlas de forma habria obligado a migrar el historial entero.
   */
  const handleFinish = () => {
    onFinish({
      completedSets: doneSets,
      totalSets,
      elapsedSeconds,
      completedAt: toLocalDateKey(new Date()),
      sets: records,
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <header className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
            {studentName}
          </p>
          {/* El reloj de la SESIÓN, en pequeño: el grande es el de la serie,
              que es lo que se mira entre repetición y repetición. Sin rutina no
              hay serie, y entonces éste vuelve a ser el protagonista. */}
          {hasPlan && (
            <p className="metric-figures shrink-0 text-xs font-semibold text-ink/40">
              {formatDuration(elapsedSeconds)}
            </p>
          )}
        </div>
        <h1 className="truncate font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
          {routine?.title ?? session.title}
        </h1>
      </header>

      {hasPlan ? (
        <>
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
            {/* A mano y no con `Progress`: el de Radix informa un porcentaje
                —`aria-valuemax` siempre 100— y aquí la magnitud son SERIES.
                «12 de 18» es lo que se anuncia; «67 %» obliga a la cuenta
                inversa. */}
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

          {currentStep === null ? (
            <section className="shrink-0 border-b border-cobalt-tint-3 px-5 py-8 text-center">
              <p className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
                {t('liveSession.allDone')}
              </p>
              <p className="mt-2 text-sm text-ink/55">{t('liveSession.allDoneHint')}</p>
            </section>
          ) : (
            <SetTracker
              step={currentStep}
              phase={phase}
              phaseSeconds={phaseSeconds}
              repsDone={repsDone}
              targetReps={targetReps}
              weightKg={weightKg}
              lastWeightKg={lastWeights.get(currentStep.exerciseId) ?? null}
              exerciseName={nameOf(currentStep.exerciseId)}
              nextStep={nextStep}
              nextExerciseName={nameOf(nextStep?.exerciseId)}
              lastRecord={lastRecord}
              onMarkReps={markReps}
              onSetWeight={setWeight}
              onAdjustWeight={adjustWeight}
              onFinishSet={finishSet}
              onStartNextSet={startNextSet}
            />
          )}

          <div className="flex-1 overflow-auto">
            <SessionPlanList
              steps={steps}
              currentIndex={currentIndex}
              exercisesById={exercisesById}
              records={records}
            />
          </div>
        </>
      ) : (
        <>
          <SessionDuration elapsedSeconds={elapsedSeconds} state={state} />
          <div className="flex-1 overflow-auto">
            <p className="px-5 py-12 text-center text-sm text-ink/40">
              {t('liveSession.noRoutine')}
            </p>
          </div>
        </>
      )}

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
