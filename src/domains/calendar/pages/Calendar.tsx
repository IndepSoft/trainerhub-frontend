import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { PageHeader } from '@/shared/components/PageHeader'
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
    canChooseViewMode,
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
    // Misma estructura de scroll que el resto de paginas: la cabecera queda
    // fija y solo desplaza <main>. Antes esta pagina era un `space-y-6` suelto,
    // asi que scrolleaba entera dentro del layout y su cabecera se iba con el
    // contenido.
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Content>
          <div>
            <PageHeader.Eyebrow>Tus sesiones</PageHeader.Eyebrow>
            <PageHeader.Title>Agenda</PageHeader.Title>
          </div>
          <PageHeader.Actions>
            {/* El selector solo aparece cuando hay algo que elegir: en movil el
                modo esta forzado a dia, asi que ofrecerlo mentiria. */}
            {canChooseViewMode && (
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
            )}
            <CreateSessionModal />
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
          proposito: el landmark <main> ya lo pinta SidebarInset desde
          RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
          admite uno por documento- ademas de confundir a los lectores de
          pantalla. */}
      <div className="flex-1 overflow-auto">
        <div className="ps-4 pe-4 pb-4 pt-4 max-w-8xl mx-auto space-y-6">
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
        </div>
      </div>

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
