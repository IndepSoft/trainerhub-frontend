import { Button } from '@/shared/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatFullDate, formatWeekRange } from '../libs/calendar.utils'
import type { CalendarViewMode } from '../types/calendar.types'

interface CalendarNavigationProps {
  viewMode: CalendarViewMode
  currentDate: Date
  weekDates: Date[]
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarNavigation({
  viewMode,
  currentDate,
  weekDates,
  onPrevious,
  onNext,
  onToday,
}: CalendarNavigationProps) {
  const title =
    viewMode === 'week' ? formatWeekRange(weekDates) : formatFullDate(currentDate)

  return (
    // Envuelve en movil: con una fecha larga como "jueves, 27 de agosto de
    // 2026", el titulo y el boton "Hoy" se comprimian mutuamente.
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 sm:gap-4">
        {/*
          Los botones ya no eligen entre navegar semana o dia: el hook resuelve
          el salto segun el modo. Antes cada boton llevaba el ternario
          `viewMode === "week" ? navigateWeek(...) : navigateDay(...)` repetido.
        */}
        <Button
          variant="outline"
          size="sm"
          className="h-11 w-11 shrink-0 sm:h-9 sm:w-9"
          onClick={onPrevious}
          aria-label="Periodo anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-base font-semibold sm:text-xl">{title}</h2>
        <Button
          variant="outline"
          size="sm"
          className="h-11 w-11 shrink-0 sm:h-9 sm:w-9"
          onClick={onNext}
          aria-label="Periodo siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <Button variant="outline" className="h-11 sm:h-9" onClick={onToday}>
        Hoy
      </Button>
    </div>
  )
}
