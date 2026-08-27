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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/*
          Los botones ya no eligen entre navegar semana o dia: el hook resuelve
          el salto segun el modo. Antes cada boton llevaba el ternario
          `viewMode === "week" ? navigateWeek(...) : navigateDay(...)` repetido.
        */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          aria-label="Periodo anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          aria-label="Periodo siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <Button variant="outline" onClick={onToday}>
        Hoy
      </Button>
    </div>
  )
}
