import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  formatCompactDate,
  formatCompactWeekRange,
  formatFullDate,
  formatWeekRange,
} from '../libs/calendar.utils'
import type { CalendarViewMode } from '../types/calendar.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface CalendarNavigationProps {
  viewMode: CalendarViewMode
  currentDate: Date
  weekDates: Date[]
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
}

/**
 * Navegación temporal de la agenda.
 *
 * Una sola fila, siempre. Antes envolvía en móvil y ocupaba dos, porque
 * «sábado, 29 de agosto de 2026» no cabe junto a los tres botones; se comía
 * unos 56 px del campo de visión de la rejilla, que es lo que de verdad se
 * mira en esta pantalla.
 *
 * La fecha se muestra en dos versiones y es el CSS quien elige: corta hasta
 * `sm`, completa a partir de ahí. Se renderizan las dos porque decidir con
 * JavaScript obligaría a un hook de tamaño y a un re-render por cada
 * redimensionado, para un cambio que el navegador resuelve solo.
 */
export function CalendarNavigation({
  viewMode,
  currentDate,
  weekDates,
  onPrevious,
  onNext,
  onToday,
}: CalendarNavigationProps) {
  const { t } = useTranslation()
  const isWeek = viewMode === 'week'
  const compact = isWeek ? formatCompactWeekRange(weekDates) : formatCompactDate(currentDate)
  const full = isWeek ? formatWeekRange(weekDates) : formatFullDate(currentDate)

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onPrevious}
        aria-label={t('calendar.previousPeriod')}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/50 transition-colors hover:text-cobalt"
      >
        <ChevronLeft className="size-5" />
      </button>

      <h2 className="min-w-0 flex-1 truncate text-center font-semibold text-ink sm:text-left">
        <span className="sm:hidden">{compact}</span>
        <span className="hidden sm:inline">{full}</span>
      </h2>

      <button
        type="button"
        onClick={onNext}
        aria-label={t('calendar.nextPeriod')}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/50 transition-colors hover:text-cobalt"
      >
        <ChevronRight className="size-5" />
      </button>

      <button
        type="button"
        onClick={onToday}
        className="ms-1 inline-flex h-11 shrink-0 items-center rounded-action border border-cobalt-tint-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink/60 transition-colors hover:border-cobalt/40 hover:text-cobalt"
      >
        {t('calendar.today')}
      </button>
    </div>
  )
}
