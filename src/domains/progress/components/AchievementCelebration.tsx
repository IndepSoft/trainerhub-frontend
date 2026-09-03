import { useEffect } from 'react'
import { ConfettiBurst } from '@/shared/components/ConfettiBurst'
import { HapticPattern, vibrate } from '@/shared/lib/haptics'
import type { Achievement } from '../types/achievement.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface AchievementCelebrationProps {
  achievement: Achievement
  /** Cifra protagonista: días de racha, sesiones, lo que el logro celebre. */
  headlineValue: number
  headlineLabel: string
  onDismiss: () => void
  dismissLabel?: string
}

/**
 * Celebración de logro. Registro agresivo.
 *
 * Es la única pantalla donde se invierte el peso del sistema: fondo Ink, Ember
 * dominante y tipografía Condensed enorme. Cobalt desaparece. Esa inversión es
 * lo que hace que se sienta otro momento sin ser otra aplicación: mismos
 * colores, mismo tipo, proporciones opuestas.
 *
 * El elemento firma es el corte diagonal: un `clip-path` que parte el bloque de
 * color en vez de apoyarse en una caja con borde redondeado. Ningún generador
 * produce esa forma por defecto, que era justamente el criterio del plan.
 */
export function AchievementCelebration({
  achievement,
  headlineValue,
  headlineLabel,
  onDismiss,
  dismissLabel,
}: AchievementCelebrationProps) {
  const { t } = useTranslation()

  useEffect(() => {
    // El resultado se ignora a proposito: en iOS no existe la Vibration API y la
    // celebracion tiene que funcionar igual. Ver shared/lib/haptics.
    vibrate(HapticPattern.CELEBRATE)
  }, [])

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-ink">
      <ConfettiBurst />

      {/* La banda diagonal. Va detras del texto y sangra por los dos lados para
          que el corte no se lea como un rectangulo girado. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-[-10%] top-[22%] h-52 bg-ember"
        style={{ clipPath: 'polygon(0 42%, 100% 0, 100% 58%, 0 100%)' }}
      />

      <div className="relative flex flex-1 flex-col justify-center px-6 py-16">
        <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-ember">
          {t('achievement.unlocked')}
        </p>

        <p className="metric-figures mt-2 font-display text-[7rem] font-extrabold leading-[0.82] tracking-tighter text-white sm:text-[9rem]">
          {headlineValue}
        </p>

        <p className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-white/90">
          {headlineLabel}
        </p>

        <div className="mt-10 max-w-sm">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
            {t(achievement.nameKey)}
          </h2>
          <p className="mt-1 text-white/60">{t(achievement.descriptionKey)}</p>
          {/* Blanco y no Ember: este bloque puede caer sobre la banda naranja,
              y Ember sobre Ember no se ve. Se comprobo en captura. */}
          <p className="metric-figures mt-4 font-display text-2xl font-extrabold text-white">
            +{achievement.pointsReward}
            <span className="ml-1.5 text-sm font-bold uppercase tracking-widest text-white/60">
              XP
            </span>
          </p>
        </div>
      </div>

      <div className="relative px-6 pb-10" style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full bg-surface py-5 font-display text-lg font-extrabold uppercase tracking-[0.2em] text-ink transition-transform active:scale-[0.98]"
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  )
}
