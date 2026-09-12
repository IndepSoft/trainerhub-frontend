import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface StepIndicatorProps {
  /** El paso en curso, empezando en 1. */
  current: number
  total: number
}

/**
 * En qué paso del alta se está: un segmento por paso, encendidos hasta el actual.
 *
 * Es una imagen con nombre, no una lista: un lector de pantalla necesita
 * «paso 1 de 2», no dos elementos vacíos. El nombre lo da el diccionario y los
 * segmentos son sólo el dibujo.
 */
export function StepIndicator({ current, total }: StepIndicatorProps) {
  const { t } = useTranslation()
  const steps = Array.from({ length: total }, (_, index) => index + 1)

  return (
    <div
      role="img"
      aria-label={t('register.step', { step: current, total })}
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
    >
      {steps.map((step) => (
        <span
          key={step}
          className={cn('h-[3px]', step <= current ? 'bg-ember' : 'bg-ink/10')}
        />
      ))}
    </div>
  )
}
