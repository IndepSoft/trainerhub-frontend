import { formatDuration } from '../libs/session.utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import type { LiveSessionState } from '../types/session.types'

interface SessionDurationProps {
  elapsedSeconds: number
  state: LiveSessionState
}

const STATE_LABEL_KEY: Record<LiveSessionState, TranslationKey> = {
  running: 'liveSession.duration',
  paused: 'liveSession.paused',
  finished: 'liveSession.finished',
}

/**
 * La cifra protagonista.
 *
 * Es el elemento firma del registro sobrio: Condensed muy grande, cifras
 * tabulares y una regla corta en Cobalt que subraya la métrica activa. Sin
 * `tabular-nums` el número saltaría de ancho cada segundo.
 */
export function SessionDuration({ elapsedSeconds, state }: SessionDurationProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-3 px-5 py-8">
      <p className="metric-figures font-display text-7xl font-extrabold leading-none tracking-tight text-ink">
        {formatDuration(elapsedSeconds)}
      </p>

      <span aria-hidden="true" className="h-[3px] w-16 bg-cobalt" />

      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50">
        {t(STATE_LABEL_KEY[state])}
      </p>
    </div>
  )
}
