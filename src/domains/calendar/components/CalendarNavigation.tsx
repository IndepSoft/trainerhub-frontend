import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface CalendarDirectionControlsProps {
  onPrevious: () => void
  onNext: () => void
  className?: string
}

const DIRECTION_BUTTON_CLASS_NAME =
  'inline-flex size-11 items-center justify-center rounded-action border border-cobalt-tint-3 text-ink transition-colors hover:border-cobalt/40 hover:text-cobalt md:size-9'

/**
 * Atrás y adelante en el tiempo, juntos: son un par y se pulsan alternados.
 *
 * Sin la fecha entre medias. La fecha ES el título de la pantalla —la pinta
 * la cabecera en `PageHeader.Title`— y aquí ya no hay que repetirla: antes
 * esta fila la llevaba en el medio con «Agenda» encima como título, o sea dos
 * líneas para decir dónde se está. La cabecera de la agenda pinta el par DOS
 * veces y el CSS elige: en móvil junto a la fecha corta, que le deja sitio;
 * desde `md` con el resto de mandos. Decidirlo con JavaScript obligaría a un
 * hook de tamaño para algo que el navegador resuelve solo.
 */
export function CalendarDirectionControls({
  onPrevious,
  onNext,
  className,
}: CalendarDirectionControlsProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={onPrevious}
        aria-label={t('calendar.previousPeriod')}
        className={DIRECTION_BUTTON_CLASS_NAME}
      >
        <ChevronLeft className="size-5" />
      </button>

      <button
        type="button"
        onClick={onNext}
        aria-label={t('calendar.nextPeriod')}
        className={DIRECTION_BUTTON_CLASS_NAME}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}

interface CalendarTodayButtonProps {
  onToday: () => void
}

/** El atajo de vuelta a hoy. En Cobalt y no en tinta: es a donde se vuelve. */
export function CalendarTodayButton({ onToday }: CalendarTodayButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onToday}
      className="inline-flex h-11 items-center rounded-action border border-cobalt px-4 text-xs font-semibold uppercase tracking-wider text-cobalt transition-colors hover:bg-cobalt-tint md:h-9"
    >
      {t('calendar.today')}
    </button>
  )
}
