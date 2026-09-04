import { TIME_SLOTS, weekDayLabels } from '../data/calendarOptions'
import { isToday } from '../libs/calendar.utils'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import { SessionLane } from './SessionLane'
import { SessionCard } from './SessionCard'
import { cn } from '@/shared/lib/utils'
import type { Student } from '@/shared/domain/entities/student'
import { resolveSessionStudentName } from '../libs/sessionStudent'
import type { Session } from '../types/calendar.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/** Alto de cada tramo de 30 minutos en la rejilla semanal. */
const SLOT_HEIGHT = 48

interface WeekViewProps {
  weekDates: Date[]
  getSessionsOfDay: (date: Date) => Session[]
  onSelectSession: (session: Session) => void
  /** Alumnos indexados, para resolver el nombre de cada sesion una sola vez. */
  studentsById: Map<string, Student>
}

/**
 * Rejilla semanal.
 *
 * La columna de horas es de ancho FIJO y estrecho. Antes la rejilla era
 * `grid-cols-8` con ocho columnas idénticas, así que una etiqueta de 44 px
 * recibía los mismos 143 px que un día entero: casi cien píxeles que se le
 * quitaban a las siete columnas donde viven las sesiones.
 *
 * Las sesiones se colocan sobre la escala y cruzan los tramos que ocupen, en
 * vez de vivir dentro de una celda. Ver `SessionLane`.
 */
export function WeekView({
  weekDates,
  getSessionsOfDay,
  onSelectSession,
  studentsById,
}: WeekViewProps) {
  const { t } = useTranslation()
  const dayLabels = weekDayLabels()
  return (
    <div className="border-y border-cobalt-tint-3">
      {/* Pegada arriba del contenedor de scroll: al desplazar la rejilla, saber
          en que columna cae cada dia es imprescindible, y sin esto la fila de
          dias se iba con el contenido. Fondo opaco obligatorio, o la rejilla se
          transparenta por debajo al pasar. */}
      <div className="sticky top-0 z-10 flex border-b border-cobalt-tint-3 bg-bone">
        <div className="w-14 shrink-0" />
        {weekDates.map((date, index) => (
          <div key={toLocalDateKey(date)} className="min-w-0 flex-1 py-2 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/50">
              {dayLabels[index]}
            </p>
            <p
              className={cn(
                'metric-figures font-display text-lg font-bold leading-none',
                isToday(date) ? 'text-cobalt' : 'text-ink/70'
              )}
            >
              {date.getDate()}
            </p>
          </div>
        ))}
      </div>

      <div className="flex">
        <div className="w-14 shrink-0 border-e border-cobalt-tint-3">
          {TIME_SLOTS.map((time) => (
            <div
              key={time}
              className="metric-figures flex items-start justify-end pe-2 pt-1 text-[11px] font-semibold tabular-nums text-ink/35"
              style={{ height: SLOT_HEIGHT }}
            >
              {/* Sólo la hora en punto. Con las veintisiete etiquetas la columna
                  es una lista de números y deja de leerse como una escala. */}
              {time.endsWith(':00') ? time : ''}
            </div>
          ))}
        </div>

        {weekDates.map((date) => (
          <SessionLane
            key={toLocalDateKey(date)}
            className="min-w-0 flex-1 border-e border-cobalt-tint-3 last:border-e-0"
            sessions={getSessionsOfDay(date)}
            slotHeight={SLOT_HEIGHT}
            renderSession={(session) => (
              <SessionCard
                session={session}
                studentName={resolveSessionStudentName(session, studentsById, t)}
                onSelect={onSelectSession}
                variant="compact"
              />
            )}
          />
        ))}
      </div>
    </div>
  )
}
