import { TIME_SLOTS } from '../data/calendarOptions'
import { SessionLane } from './SessionLane'
import { SessionCard } from './SessionCard'
import type { Student } from '@/shared/domain/entities/student'
import { resolveSessionStudentName } from '../libs/sessionStudent'
import type { Session } from '../types/calendar.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/** Alto de cada tramo de 30 minutos en la vista de día. */
const SLOT_HEIGHT = 64

interface DayViewProps {
  date: Date
  getSessionsOfDay: (date: Date) => Session[]
  onSelectSession: (session: Session) => void
  /** Alumnos indexados, para resolver el nombre de cada sesion una sola vez. */
  studentsById: Map<string, Student>
}

/**
 * Vista de día.
 *
 * La hora va en una columna fija y estrecha: sólo tiene que caber «08:00», y
 * darle el mismo ancho que al contenido era regalarle sitio a una etiqueta.
 *
 * Las sesiones se colocan sobre la escala, no dentro de un tramo, así que una
 * de 60 minutos ocupa el doble de alto que una de 30 y una que empieza a y
 * cuarto arranca a y cuarto. Ver `SessionLane`.
 */
export function DayView({
  date,
  getSessionsOfDay,
  onSelectSession,
  studentsById,
}: DayViewProps) {
  const { t } = useTranslation()
  return (
    <div className="flex border-y border-cobalt-tint-3">
      <div className="w-14 shrink-0 border-e border-cobalt-tint-3">
        {TIME_SLOTS.map((time) => (
          <div
            key={time}
            className="metric-figures flex items-start justify-end pe-2 pt-1 text-[11px] font-semibold tabular-nums text-ink/35"
            style={{ height: SLOT_HEIGHT }}
          >
            {/* Sólo se rotula la hora en punto. Con las veintisiete etiquetas, la
                columna es una lista de números y deja de leerse como una escala. */}
            {time.endsWith(':00') ? time : ''}
          </div>
        ))}
      </div>

      <SessionLane
        className="flex-1"
        sessions={getSessionsOfDay(date)}
        slotHeight={SLOT_HEIGHT}
        renderSession={(session, isCompact) => (
          <SessionCard
            studentName={resolveSessionStudentName(session, studentsById, t)}
            session={session}
            onSelect={onSelectSession}
            variant={isCompact ? 'compact' : 'full'}
          />
        )}
      />
    </div>
  )
}
