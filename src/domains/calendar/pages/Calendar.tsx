import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/shared/components/PageHeader'
import { CreateSessionModal } from '../components/CreateSessionModal'
import { SessionDetailsModal } from '../components/SessionDetailsModal'
import { CalendarDirectionControls, CalendarTodayButton } from '../components/CalendarNavigation'
import { WeekView } from '../components/WeekView'
import { DayView } from '../components/DayView'
import { SessionSummary } from '../components/SessionSummary'
import { useCalendar } from '../hooks/useCalendar'
import { useSchedulableStudents } from '../hooks/useSchedulableStudents'
import { useSessionDetailsActions } from '../hooks/useSessionDetailsActions'
import { useSendNotice } from '@/shared/hooks/useSendNotice'
import { useViewerContext } from '@/app/ViewerContext'
import { activeLocale } from '@/shared/i18n/activeLocale'
import {
  formatCompactDate,
  formatCompactWeekRange,
  formatFullDate,
  formatWeekRange,
  parseLocalDateKey,
} from '../libs/calendar.utils'
import type { CalendarViewMode, Session, SessionDetailsChanges } from '../types/calendar.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

export default function Calendar() {
  const { t } = useTranslation()
  const { can } = useViewerContext()
  /*
   * «Usar en una sesion» llega aqui como `/calendar?routine=<id>`: la ficha de
   * la rutina no abre ningun dialogo por su cuenta -no puede, vive en otro
   * dominio-, sino que navega a la agenda diciendo con que rutina.
   *
   * El parametro se limpia al abrir para que recargar o volver atras no reabra
   * el formulario, y para que la URL no se quede diciendo algo que ya no es.
   */
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  /*
   * La rutina se COPIA a estado en vez de leerse de la URL en cada render. Al
   * limpiar el parametro, leerla de la URL la habria dejado en `null` en el
   * render siguiente, cambiando la `key` del formulario y remontandolo justo
   * despues de haberlo abierto: el dialogo aparecia sin la rutina puesta.
   */
  const [preselectedRoutineId, setPreselectedRoutineId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const requested = searchParams.get('routine')
    if (requested === null) return

    setPreselectedRoutineId(requested)
    setIsCreateOpen(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const { students } = useSchedulableStudents()

  /*
   * Los alumnos se indexan UNA vez para toda la pagina. La sesion guarda el
   * identificador, no el nombre, y resolverlo dentro de cada tarjeta habria
   * significado una consulta por tarjeta para el mismo dato.
   */
  const studentsById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students]
  )

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

  const isWeek = viewMode === 'week'
  const compactPeriodLabel = isWeek
    ? formatCompactWeekRange(weekDates)
    : formatCompactDate(currentDate)
  const fullPeriodLabel = isWeek ? formatWeekRange(weekDates) : formatFullDate(currentDate)

  const { saveDetails, removeSession } = useSessionDetailsActions()
  const { sendNotice } = useSendNotice()

  /*
   * Ahora cambia de verdad. Antes lanzaba un aviso y no tocaba nada: la sesion
   * nacia pendiente y moria pendiente, asi que los contadores de la agenda solo
   * podian reflejar la semilla y nada de lo que hacia el entrenador podia darse
   * por hecho.
   */
  const handleSave = async (sessionId: string, changes: SessionDetailsChanges) => {
    if (selectedSession === null || selectedSession.id !== sessionId) return
    await saveDetails(selectedSession, changes)
  }

  /*
   * El recordatorio es un AVISO en la bandeja del alumno, el mismo canal que
   * las cuotas. El texto se compone aqui y se guarda tal cual: es lo que dice
   * el selector de idioma, lo escrito queda en el idioma en que se escribio.
   */
  const handleSendReminder = async (session: Session) => {
    if (session.studentId === null) return
    await sendNotice({
      studentId: session.studentId,
      kind: 'general',
      body: t('sessionDetails.reminderBody', {
        title: session.title,
        date: parseLocalDateKey(session.date).toLocaleDateString(activeLocale(), {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }),
        time: session.time,
      }),
    })
  }

  /*
   * La sesion que se esta editando en el formulario. Es estado propio y no
   * `selectedSession` porque la ficha se cierra al pulsar «Editar» -y con ella
   * se vacia la seleccion- mientras el formulario tiene que seguir sabiendo
   * cual era.
   */
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  return (
    // Misma estructura de scroll que el resto de paginas: la cabecera queda
    // fija y solo desplaza <main>. Antes esta pagina era un `space-y-6` suelto,
    // asi que scrolleaba entera dentro del layout y su cabecera se iba con el
    // contenido.
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      {/* Cabecera mas ajustada que en el resto de paginas: aqui el contenido es
          una rejilla temporal, y cada pixel de cromo sale del campo de vision de
          las celdas, que es lo unico que se mira. */}
      <PageHeader className="md:pt-4 md:pb-3">
        <PageHeader.Content>
          <PageHeader.Eyebrow>{t('calendar.title')}</PageHeader.Eyebrow>

          {/* La fecha es el titulo: es lo que se esta mirando. «Agenda» ya lo
              dice la pestana de abajo y el eyebrow. Corta hasta `md` —«sáb 29
              ago»— y con el par atras/adelante a su lado, en el sitio que la
              fecha corta deja libre: asi la agenda no necesita una fila de
              mandos aparte y su cabecera mide lo que la de cualquier pagina. */}
          <div className="[grid-area:title] flex items-center justify-between gap-3">
            <PageHeader.Title className="truncate">
              <span className="md:hidden">{compactPeriodLabel}</span>
              <span className="hidden md:inline">{fullPeriodLabel}</span>
            </PageHeader.Title>
            <CalendarDirectionControls
              onPrevious={goToPrevious}
              onNext={goToNext}
              className="shrink-0 md:hidden"
            />
          </div>

          <PageHeader.Actions>
            <CalendarDirectionControls
              onPrevious={goToPrevious}
              onNext={goToNext}
              className="hidden md:flex"
            />
            <CalendarTodayButton onToday={goToToday} />
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
                  <SelectItem value="week">{t('calendar.week')}</SelectItem>
                  <SelectItem value="day">{t('calendar.day')}</SelectItem>
                </SelectContent>
              </Select>
            )}
            {/* Agendar es del entrenador. Un alumno abre la agenda para VER lo
                que tiene, no para ponerse sesiones: quien decide cuando entrena
                es quien le entrena. */}
            {can('schedule.manage') && (
              <PageHeader.PrimaryAction
                icon={Plus}
                label={t('newSession.open')}
                shortLabel={t('newSession.openShort')}
                onClick={() => setIsCreateOpen(true)}
              />
            )}
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      {/* El formulario del alta. `key` para que se monte de nuevo con la
          rutina ya elegida: su estado inicial se toma una sola vez. Vive fuera
          de la cabecera porque ya no pinta boton: lo abre la accion de arriba
          o la URL con `?routine=`. */}
      {can('schedule.manage') && (
        <CreateSessionModal
          key={preselectedRoutineId ?? 'sin-rutina'}
          preselectedRoutineId={preselectedRoutineId}
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      )}

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
              studentsById={studentsById}
              />
            ) : (
              <DayView
                date={currentDate}
                getSessionsOfDay={getSessionsOfDay}
                onSelectSession={selectSession}
              studentsById={studentsById}
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
          onSave={handleSave}
          onEdit={setEditingSession}
          onDelete={removeSession}
          onSendReminder={handleSendReminder}
        />
      )}

      {/* El formulario del alta, con la sesion ya puesta. `key` por lo mismo
          que arriba: su estado inicial se toma una sola vez. Sin disparador
          propio: se abre desde «Editar» de la ficha. */}
      {editingSession !== null && (
        <CreateSessionModal
          key={editingSession.id}
          editing={editingSession}
          open
          onOpenChange={(open) => !open && setEditingSession(null)}
        />
      )}
    </div>
  )
}
