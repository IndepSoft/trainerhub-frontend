import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { toast } from 'sonner'
import { CreateSessionModal } from '../components/CreateSessionModal'
import { SessionDetailsModal } from '../components/SessionDetailsModal'
import { CalendarNavigation } from '../components/CalendarNavigation'
import { WeekView } from '../components/WeekView'
import { DayView } from '../components/DayView'
import { SessionSummary } from '../components/SessionSummary'
import { useCalendar } from '../hooks/useCalendar'
import type { CalendarViewMode } from '../types/calendar.types'

export default function Calendar() {
  const {
    currentDate,
    weekDates,
    viewMode,
    selectedSession,
    countByStatus,
    setViewMode,
    goToToday,
    goToPrevious,
    goToNext,
    selectSession,
    getSessionsAt,
  } = useCalendar()

  // TODO: sin implementar. Solo muestra un aviso; el estado de la sesion no
  // cambia en ningun sitio. Requiere el SessionRepository.
  const handleStatusChange = (_sessionId: string, newStatus: string) => {
    toast(`La sesión ha sido marcada como ${newStatus}.`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Agenda y Programación
          </h1>
          <p className="text-muted-foreground">Gestiona tus sesiones y citas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={viewMode}
            onValueChange={(value: CalendarViewMode) => setViewMode(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="day">Día</SelectItem>
            </SelectContent>
          </Select>
          <CreateSessionModal />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CalendarNavigation
            viewMode={viewMode}
            currentDate={currentDate}
            weekDates={weekDates}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onToday={goToToday}
          />
        </CardHeader>
        <CardContent>
          {viewMode === 'week' ? (
            <WeekView
              weekDates={weekDates}
              getSessionsAt={getSessionsAt}
              onSelectSession={selectSession}
            />
          ) : (
            <DayView
              date={currentDate}
              getSessionsAt={getSessionsAt}
              onSelectSession={selectSession}
            />
          )}
        </CardContent>
      </Card>

      <SessionSummary countByStatus={countByStatus} />

      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open) => !open && selectSession(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
