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
    getSessionsOfDay,
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
      {/* Cabecera mas ajustada que en el resto de paginas: aqui el contenido es
          una rejilla temporal, y cada pixel de cromo sale del campo de vision de
          las celdas, que es lo unico que se mira. */}
      <PageHeader className="pt-4 pb-3">
        <PageHeader.Content className="gap-3">
          <div className="min-w-0">
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

        {/* Fuera del contenedor de scroll: la navegacion temporal no debe irse
            con la rejilla. Antes vivia dentro y desaparecia al desplazarse, que
            es justo cuando hace falta saber que dia se esta mirando. */}
        <div className="mt-3 border-t border-cobalt-tint-3 pt-1">
          <CalendarNavigation
            viewMode={viewMode}
            currentDate={currentDate}
            weekDates={weekDates}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onToday={goToToday}
          />
        </div>
      </PageHeader>

      {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
          proposito: el landmark <main> ya lo pinta SidebarInset desde
          RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
          admite uno por documento- ademas de confundir a los lectores de
          pantalla. */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-8xl mx-auto pb-4">
          {/* Sin envoltura <Card>, por el mismo motivo que en Reportes y
              Progreso: su relleno se sumaba al de la pagina y al de cada tramo
              horario, y dejaba el bloque de una sesion en 173 px a 375 px de
              ancho. La pagina ya es el marco. */}
          <section>
            {viewMode === 'week' ? (
              <WeekView
                weekDates={weekDates}
                getSessionsOfDay={getSessionsOfDay}
                onSelectSession={selectSession}
              />
            ) : (
              <DayView
                date={currentDate}
                getSessionsOfDay={getSessionsOfDay}
                onSelectSession={selectSession}
              />
            )}
          </section>

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
