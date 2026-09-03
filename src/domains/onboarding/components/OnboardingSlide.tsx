import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { OnboardingStep } from '../types/onboarding.types'

interface OnboardingSlideProps {
  step: OnboardingStep
  /** Alterna la inclinación del corte entre pasos. */
  mirrored: boolean
}

/**
 * Un paso del onboarding, en registro agresivo.
 *
 * Comparte lenguaje con la celebración de logro —fondo Ink, banda Ember
 * diagonal, Condensed enorme— porque son el mismo momento de la aplicación: el
 * que grita. Lo que las separa es el contenido, no el estilo.
 *
 * El corte se invierte en pasos alternos. Con la misma inclinación cuatro veces
 * seguidas, el gesto de deslizar no se percibe como avance sino como un fallo
 * de repintado.
 */
export function OnboardingSlide({ step, mirrored }: OnboardingSlideProps) {
  const { t } = useTranslation()
  const Icon = step.icon

  return (
    <div className="relative flex flex-1 flex-col justify-center overflow-hidden px-6">
      <div
        aria-hidden="true"
        className="absolute inset-x-[-12%] top-[26%] h-48 bg-ember"
        style={{
          clipPath: mirrored
            ? 'polygon(0 0, 100% 40%, 100% 100%, 0 60%)'
            : 'polygon(0 40%, 100% 0, 100% 60%, 0 100%)',
        }}
      />

      {/* Solo se acota el texto. La banda sigue sangrando de lado a lado:
          un corte diagonal que se detiene a mitad de pantalla deja de leerse
          como un corte y pasa a leerse como un rectangulo girado. */}
      <div className="relative mx-auto w-full max-w-3xl">
        <Icon className="mb-6 size-8 text-ember" strokeWidth={2.25} />

        <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-ember">
          {t(step.eyebrowKey)}
        </p>

        {/* El titular llega ya partido en lineas desde los datos: donde corta
            una frase es una decision de composicion, y dejarsela al ancho
            disponible produce viudas y cortes en mitad de una idea. */}
        <h2 className="mt-3 font-display text-[3.25rem] font-extrabold uppercase leading-[0.88] tracking-tight text-white sm:text-6xl">
          {step.headlineKeys.map((key, index) => (
            <span key={key} className={cn('block', index === 1 && 'text-white/95')}>
              {t(key)}
            </span>
          ))}
        </h2>

        <p className="mt-6 max-w-sm text-white/60">{t(step.bodyKey)}</p>
      </div>
    </div>
  )
}
