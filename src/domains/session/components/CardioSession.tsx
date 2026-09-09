import { useLiveSession } from '../hooks/useLiveSession'
import { SessionDuration } from './SessionDuration'
import { SlideToAction } from './SlideToAction'
import { LeaveSessionLink } from './LeaveSessionLink'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import type { Session, SessionResult } from '@/shared/domain/entities/session'

interface CardioSessionProps {
  session: Session
  studentName: string
  onFinish: (result: SessionResult) => void
  /** A donde se vuelve si se sale sin terminar. */
  exitTo: string
}

/**
 * Sesión de cardio en marcha: un cronómetro.
 *
 * Tenía distancia, ritmo, calorías y un trazado GPS, y todo era una semilla
 * con un contador: entraba en siete minutos y 1,19 km que nadie había
 * corrido. Fuera. Sin sensor, lo único que esta pantalla sabe de verdad es
 * cuánto tiempo lleva, y es lo que anota al cerrar. Cuando haya GPS entrará
 * por un puerto y volverá a haber qué pintar.
 */
export function CardioSession({
  session,
  studentName,
  onFinish,
  exitTo,
}: CardioSessionProps) {
  const { t } = useTranslation()
  const { elapsedSeconds, state, pause, resume, finish } = useLiveSession()

  const isRunning = state === 'running'

  /*
   * Finalizar cierra la sesion de verdad -pasa a completada- ademas de llevar a
   * la celebracion. El gesto de deslizar protege aqui con mas motivo: terminar
   * por error una sesion en marcha no tiene vuelta atras. Solo aparece en pausa,
   * para que no compita con la accion principal.
   */
  const handleFinish = () => {
    finish()
    onFinish({
      // Cardio no se programa en series, y cero no es un hueco: es el numero
      // correcto. Lo que mide una sesion de cardio es el tiempo.
      completedSets: 0,
      totalSets: 0,
      elapsedSeconds,
      completedAt: toLocalDateKey(new Date()),
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <header className="flex shrink-0 items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
            {studentName}
          </p>
          <h1 className="truncate font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {session.title}
          </h1>
        </div>

        <LeaveSessionLink to={exitTo} />
      </header>

      <div className="flex flex-1 flex-col justify-center overflow-auto">
        <SessionDuration elapsedSeconds={elapsedSeconds} state={state} />
        <p className="px-5 pb-8 text-center text-sm text-ink/40">
          {t('liveSession.cardioHint')}
        </p>
      </div>

      {/* El margen de zona segura va aqui y no en cada franja: con dos
          apiladas, aplicarlo a ambas dejaria un hueco entre ellas. En una
          PWA instalada esto es lo que evita chocar con la barra de gestos. */}
      <div
        className="shrink-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {!isRunning && (
          <SlideToAction
            variant="finish"
            label={t('liveSession.slideToFinish')}
            accessibleLabel={t('liveSession.finish')}
            onConfirm={handleFinish}
          />
        )}

        <SlideToAction
          label={
            isRunning
              ? t('liveSession.slideToPause')
              : t('liveSession.slideToResume')
          }
          accessibleLabel={
            isRunning ? t('liveSession.pause') : t('liveSession.resume')
          }
          onConfirm={isRunning ? pause : resume}
        />
      </div>
    </div>
  )
}
