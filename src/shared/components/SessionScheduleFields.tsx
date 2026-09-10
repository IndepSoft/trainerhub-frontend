import { Calendar } from '@/shared/ui/calendar'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { cn } from '@/shared/lib/utils'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import { SessionModalityPicker } from './SessionModalityPicker'
import { findOverlappingSessions } from '@/shared/domain/sessionScheduling'
import {
  SESSION_DURATIONS,
  SESSION_LOCATIONS,
  SESSION_TIME_SLOTS,
  type Session,
  type SessionModality,
} from '@/shared/domain/entities/session'
import type { Routine } from '@/shared/domain/entities/routine'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/** Registro de etiqueta del formulario, igual que en el resto de la aplicación. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60'

/**
 * Valor cuando la sesión no ejecuta ninguna rutina. No puede ser la cadena
 * vacía: Radix la reserva para «sin seleccionar», y «sin rutina» es una
 * elección de verdad —una evaluación inicial no ejecuta ninguna—.
 */
export const NO_ROUTINE = 'sin-rutina'

/** Los campos que la validación puede marcar en falta. */
export type SessionFieldName = 'date' | 'time' | 'location'

export interface SessionScheduleValue {
  modality: SessionModality
  routineId: string
  date: Date | undefined
  time: string
  duration: string
  location: string
  notes: string
}

interface SessionScheduleFieldsProps {
  /** Prefijo de los `id` de los controles: cada formulario el suyo. */
  idPrefix: string
  value: SessionScheduleValue
  onChange: (changes: Partial<SessionScheduleValue>) => void
  /** Las rutinas que se pueden colgar de la sesión. */
  routines: Routine[]
  /** Lo que ya hay el día elegido, para marcar los tramos ocupados. */
  sessionsOfDay: Session[]
  /** Campos que faltan, tras intentar enviar. */
  missing: SessionFieldName[]
  notesPlaceholder: string
  /** Si se dice «(opcional)» junto a las notas. */
  notesOptionalHint?: boolean
}

/**
 * El tronco común de los dos formularios que agendan: cuándo, cuánto, dónde,
 * qué se hace y con qué rutina.
 *
 * ERAN DOS COPIAS. El de la agenda y el de la ficha del alumno se separaron
 * con razón —uno empieza preguntando de quién es la sesión y el otro no— y
 * la deriva llegó por tres frentes: una lista de duraciones local, dos textos
 * sin traducir, y un manejo de errores en uno y no en otro. Lo que los dos
 * preguntan igual vive aquí; cada uno conserva su cabecera y su decisión.
 *
 * Sin estado propio: el formulario que lo monta es dueño del valor, porque es
 * quien lo valida y quien lo escribe. Esto sólo pinta y avisa.
 */
export function SessionScheduleFields({
  idPrefix,
  value,
  onChange,
  routines,
  sessionsOfDay,
  missing,
  notesPlaceholder,
  notesOptionalHint = false,
}: SessionScheduleFieldsProps) {
  const { t } = useTranslation()

  const fieldError = (field: SessionFieldName) =>
    missing.includes(field) ? (
      <span className="text-[11px] font-semibold text-danger">{t('common.missingField')}</span>
    ) : null

  return (
    <>
      <div className="space-y-2">
        <span className={cn('block', FIELD_LABEL)}>{t('session.modality.label')}</span>
        <SessionModalityPicker
          value={value.modality}
          onChange={(next) =>
            // Una sesion de cardio no ejecuta una rutina de sala, aunque
            // hubiera una elegida antes de cambiar de modalidad.
            onChange(next === 'cardio' ? { modality: next, routineId: NO_ROUTINE } : { modality: next })
          }
        />
      </div>

      {/* La rutina es OPCIONAL y solo aparece en fuerza: una evaluacion
          inicial no ejecuta ninguna, y una salida a correr tampoco. */}
      {value.modality === 'strength' && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-routine`} className={FIELD_LABEL}>
            {t('newSession.routine')}
          </Label>
          <Select value={value.routineId} onValueChange={(routineId) => onChange({ routineId })}>
            <SelectTrigger id={`${idPrefix}-routine`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ROUTINE}>{t('newSession.noRoutine')}</SelectItem>
              {routines.map((routine) => (
                <SelectItem key={routine.id} value={routine.id}>
                  {routine.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          {/* `<span>` y no `<Label>`: detras hay una rejilla de dias, no un
              control unico al que apuntar. */}
          <span className={FIELD_LABEL}>{t('newSession.date')}</span>
          {fieldError('date')}
        </div>
        <div
          className={cn(
            'rounded-block border p-2',
            missing.includes('date') ? 'border-danger' : 'border-cobalt-tint-3'
          )}
        >
          <Calendar
            mode="single"
            selected={value.date}
            onSelect={(date) => onChange({ date })}
            // No se agenda en el pasado: una sesion que nace vencida no sirve.
            disabled={(candidate) => candidate < new Date(new Date().setHours(0, 0, 0, 0))}
            className="mx-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={`${idPrefix}-time`} className={FIELD_LABEL}>
              {t('newSession.time')}
            </Label>
            {fieldError('time')}
          </div>
          <Select value={value.time} onValueChange={(time) => onChange({ time })}>
            <SelectTrigger
              id={`${idPrefix}-time`}
              className={cn('w-full', missing.includes('time') && 'border-danger')}
            >
              <SelectValue placeholder="--:--" />
            </SelectTrigger>
            {/* Los tramos ocupados se MARCAN, no se deshabilitan: avisar, no
                bloquear. La decision sigue siendo del entrenador. */}
            <SelectContent>
              {SESSION_TIME_SLOTS.map((slot) => {
                const busy = findOverlappingSessions(sessionsOfDay, {
                  date: value.date === undefined ? '' : toLocalDateKey(value.date),
                  time: slot,
                  durationMinutes: Number(value.duration),
                })

                return (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                    {busy.length > 0 && (
                      <span className="ms-2 text-xs text-warning">
                        {t('newSession.busySlot', { title: busy[0].title })}
                      </span>
                    )}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-duration`} className={FIELD_LABEL}>
            {t('newSession.duration')}
          </Label>
          <Select value={value.duration} onValueChange={(duration) => onChange({ duration })}>
            <SelectTrigger id={`${idPrefix}-duration`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SESSION_DURATIONS.map((minutes) => (
                <SelectItem key={minutes} value={minutes}>
                  {minutes} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={`${idPrefix}-location`} className={FIELD_LABEL}>
            {t('newSession.location')}
          </Label>
          {fieldError('location')}
        </div>
        <Select value={value.location} onValueChange={(location) => onChange({ location })}>
          <SelectTrigger
            id={`${idPrefix}-location`}
            className={cn('w-full', missing.includes('location') && 'border-danger')}
          >
            <SelectValue placeholder={t('newSession.locationPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {SESSION_LOCATIONS.map((place) => (
              <SelectItem key={place} value={place}>
                {place}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-notes`} className={FIELD_LABEL}>
          {t('newSession.notes')}
          {notesOptionalHint && (
            <>
              {' '}
              <span className="font-normal normal-case text-ink/35">{t('newSession.optional')}</span>
            </>
          )}
        </Label>
        <Textarea
          id={`${idPrefix}-notes`}
          rows={3}
          placeholder={notesPlaceholder}
          value={value.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </div>
    </>
  )
}
