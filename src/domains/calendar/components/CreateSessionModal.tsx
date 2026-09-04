import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Calendar } from '@/shared/ui/calendar'
import { CalendarCheck, Plus, User, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { getShortName } from '@/shared/lib/personName'
import { useSchedulableStudents } from '../hooks/useSchedulableStudents'
import { useSchedulableRoutines } from '../hooks/useSchedulableRoutines'
import { container } from '@/app/container'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import { activeLocale } from '@/shared/i18n/activeLocale'
import { ScheduleConflictNotice } from '@/shared/components/ScheduleConflictNotice'
import { SessionModalityPicker } from '@/shared/components/SessionModalityPicker'
import { describeOverlap, findOverlappingSessions } from '@/shared/domain/sessionScheduling'
import type { Session, SessionModality } from '@/shared/domain/entities/session'
import { SESSION_LOCATIONS, TIME_SLOTS } from '../data/calendarOptions'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { useTranslation } from '@/shared/i18n/LanguageContext'

const SESSION_TYPES = [
  { value: 'personal', labelKey: 'sessionType.personal', icon: User },
  { value: 'evaluation', labelKey: 'sessionType.evaluation', icon: User },
  { value: 'followup', labelKey: 'sessionType.followup', icon: User },
  { value: 'group', labelKey: 'sessionType.group', icon: Users },
] as const satisfies ReadonlyArray<{
  value: string
  labelKey: TranslationKey
  icon: typeof User
}>

const DURATIONS = ['30', '45', '60', '90'] as const

/** Campos que la validación puede marcar. */
type FieldName = 'sessionType' | 'student' | 'date' | 'time' | 'location'

/**
 * Valor del desplegable cuando la sesión no ejecuta ninguna rutina.
 *
 * No puede ser la cadena vacía: Radix la reserva para «sin seleccionar» y lanza
 * si un `SelectItem` la usa. Y «sin rutina» es una elección de verdad —una
 * evaluación inicial no ejecuta ninguna—, no la ausencia de elección.
 */
const NO_ROUTINE = 'sin-rutina'

/**
 * Alta de una sesión.
 *
 * Reescrito por tres motivos, no sólo por estética:
 *
 *  1. El tipo de sesión y el alumno se elegían con `<div onClick>`. Un div no
 *     recibe foco ni responde al teclado: el formulario era inaccesible sin
 *     ratón. Ahora son radios reales, ocultos visualmente y estilados con
 *     `peer-checked`.
 *  2. La validación sólo lanzaba un `toast`, y el Toaster ni siquiera estaba
 *     montado, así que enviar el formulario incompleto no producía NADA. Ahora
 *     además marca los campos que faltan junto a ellos.
 *  3. Cuatro `Card` anidadas dentro de un diálogo, que ya es un contenedor.
 */
interface CreateSessionModalProps {
  /**
   * Rutina con la que abrir el formulario ya elegida.
   *
   * Es lo que hace posible «Usar en una sesión»: la ficha de la rutina navega a
   * la agenda con su identificador, y el alta arranca con esa rutina puesta.
   */
  preselectedRoutineId?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * `open`/`onOpenChange` son opcionales: el diálogo se gobierna solo cuando nadie
 * se lo pide, y lo cede cuando la página necesita abrirlo —al llegar con una
 * rutina en la URL—. Obligar siempre al control externo habría hecho que la
 * página cargara con estado que no le importa.
 */
export function CreateSessionModal({
  preselectedRoutineId,
  open,
  onOpenChange,
}: CreateSessionModalProps = {}) {
  const { t, plural } = useTranslation()
  const { students } = useSchedulableStudents()
  const { routines } = useSchedulableRoutines()

  const [isSelfOpen, setIsSelfOpen] = useState(false)
  const isOpen = open ?? isSelfOpen
  const setIsOpen = (next: boolean) => {
    setIsSelfOpen(next)
    onOpenChange?.(next)
  }

  /*
   * Si se llega con una rutina preseleccionada -desde «Usar en una sesion»-, la
   * modalidad es fuerza sin preguntar: se viene de una rutina de sala.
   */
  const [modality, setModality] = useState<SessionModality>('strength')
  const [routineId, setRoutineId] = useState(preselectedRoutineId ?? NO_ROUTINE)
  const [sessionType, setSessionType] = useState('')
  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [missing, setMissing] = useState<FieldName[]>([])
  /** Con qué choca, o `null` si no choca o ya se decidió agendar igual. */
  const [conflict, setConflict] = useState<string | null>(null)
  /** Lo que ya hay ese día, para marcar los tramos ocupados. */
  const [sessionsOfDay, setSessionsOfDay] = useState<Session[]>([])

  // Sólo el día elegido, no la agenda entera: ver `SessionRepository.findByDate`.
  useEffect(() => {
    if (date === undefined) {
      setSessionsOfDay([])
      return
    }

    let active = true
    container.sessions.findByDate(toLocalDateKey(date)).then((result) => {
      if (active) setSessionsOfDay(result)
    })

    return () => {
      active = false
    }
  }, [date])

  /** Un choque deja de serlo en cuanto cambia alguna de las tres piezas. */
  const forgetConflict = () => setConflict(null)

  const isGroupSession = sessionType === 'group'

  const resetForm = () => {
    setConflict(null)
    setModality('strength')
    setRoutineId(NO_ROUTINE)
    setSessionType('')
    setStudentId('')
    setDate(undefined)
    setTime('')
    setDuration('60')
    setLocation('')
    setNotes('')
    setMissing([])
  }

  const handleSubmit = () => {
    const faltan: FieldName[] = []
    if (!sessionType) faltan.push('sessionType')
    if (!isGroupSession && !studentId) faltan.push('student')
    if (!date) faltan.push('date')
    if (!time) faltan.push('time')
    if (!location) faltan.push('location')

    setMissing(faltan)

    if (faltan.length > 0) {
      toast.error(
        plural('newSession.missingOne', 'newSession.missingMany', faltan.length, {
          count: faltan.length,
        })
      )
      return
    }

    /*
     * Se relee del puerto en vez de usar `sessionsOfDay`: entre elegir la hora y
     * pulsar puede haberse agendado algo, y la lista se cargo con la duracion de
     * entonces. Esta es la comprobacion que vale.
     */
    void container.sessions.findByDate(toLocalDateKey(date!)).then((sameDay) => {
      const choques = findOverlappingSessions(sameDay, {
        date: toLocalDateKey(date!),
        time,
        durationMinutes: Number(duration),
      })

      if (choques.length > 0) {
        setConflict(describeOverlap(choques))
        return
      }

      scheduleSession()
    })
  }

  /** El alta, ya sin comprobaciones: la decisión está tomada. */
  const scheduleSession = () => {
    const student = students.find((candidate) => candidate.id === studentId)
    const quien = isGroupSession
      ? t('newSession.theGroupClass')
      : getShortName(student?.firstName, student?.lastName)

    const routine = routines.find((candidate) => candidate.id === routineId)
    /*
     * La categoria y el titulo se GUARDAN, asi que quedan en el idioma de quien
     * creo la sesion. Es deliberado y es lo que dice el aviso del selector de
     * idioma: cambia lo que escribe la aplicacion, no lo que ya se escribio.
     * Traducirlos al leer exigiria guardar la clave en vez del texto, y eso es
     * una migracion del dato, no una traduccion.
     */
    const category =
      SESSION_TYPES.find((candidate) => candidate.value === sessionType)?.labelKey ??
      'sessionType.fallback'

    void container.sessions.create({
      // El titulo lo pone la rutina cuando la hay: es lo que se lee en la
      // agenda, y «Full body · Principiante» dice mas que «Entrenamiento
      // personal». NO lleva el nombre del alumno dentro: eso se resuelve desde
      // `studentId`, y meterlo aqui seria una copia que envejece.
      title: routine?.title ?? t(category),
      studentId: isGroupSession ? null : studentId,
      kind: isGroupSession ? 'group' : 'individual',
      modality,
      category: t(category),
      date: toLocalDateKey(date!),
      time,
      durationMinutes: Number(duration),
      location,
      // Recien creada esta pendiente, no confirmada: confirmarla es un acto
      // aparte y fingirlo aqui vaciaria de sentido el estado.
      status: 'pending',
      notes,
      // Una sesion de cardio no ejecuta una rutina de sala.
      routineId: modality === 'cardio' || routineId === NO_ROUTINE ? null : routineId,
      // Nace sin resultado: no ha ocurrido todavia.
      result: null,
    })

    toast.success(
      t('newSession.scheduled', {
        who: quien,
        date: date!.toLocaleDateString(activeLocale()),
        time,
      })
    )

    resetForm()
    setIsOpen(false)
  }

  /** Marca de campo pendiente. Se muestra junto al campo, no sólo en un aviso. */
  const fieldError = (field: FieldName) =>
    missing.includes(field) ? (
      <span className="text-[11px] font-semibold text-danger">{t('common.missingField')}</span>
    ) : null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) setMissing([])
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-11 gap-2 sm:h-9">
          <Plus className="size-4" />
          {t('newSession.open')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {t('newSession.title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/50">
            {t('newSession.hint')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-5 pb-5">
          <fieldset className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                {t('newSession.type')}
              </legend>
              {fieldError('sessionType')}
            </div>

            {/* Radios reales, ocultos y estilados con `peer-checked`: reciben
                foco, se recorren con el teclado y un lector de pantalla los
                anuncia como grupo. Antes eran `<div onClick>`. */}
            <div className="grid grid-cols-2 gap-2">
              {SESSION_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="relative flex cursor-pointer items-center gap-2 rounded-block border border-cobalt-tint-3 p-3 transition-colors has-[:checked]:border-cobalt has-[:checked]:bg-cobalt-tint"
                >
                  <input
                    type="radio"
                    name="session-type"
                    value={type.value}
                    checked={sessionType === type.value}
                    onChange={(event) => setSessionType(event.target.value)}
                    className="peer sr-only"
                  />
                  <type.icon className="size-4 shrink-0 text-ink/40 peer-checked:text-cobalt" />
                  <span className="text-sm font-medium leading-tight text-ink peer-checked:text-cobalt">
                    {t(type.labelKey)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* El alumno sólo tiene sentido en una sesión individual. */}
          {sessionType && !isGroupSession && (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label
                  htmlFor="new-session-student"
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60"
                >
                  {t('newSession.student')}
                </Label>
                {fieldError('student')}
              </div>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger
                  id="new-session-student"
                  className={cn('w-full', missing.includes('student') && 'border-danger')}
                >
                  <SelectValue placeholder={t('newSession.studentPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {getShortName(student.firstName, student.lastName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              {/* `<span>` y no `<Label>`: no hay un control unico al que
                  apuntar -detras hay una rejilla de dias- y una etiqueta sin
                  asociar es peor que ninguna. */}
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                {t('newSession.date')}
              </span>
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
                selected={date}
                onSelect={(next) => {
                  forgetConflict()
                  setDate(next)
                }}
                // No se agenda en el pasado: dejarlo permitiría crear una
                // sesión que nace ya vencida.
                disabled={(candidate) =>
                  candidate < new Date(new Date().setHours(0, 0, 0, 0))
                }
                className="mx-auto"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label
                  htmlFor="new-session-time"
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60"
                >
                  {t('newSession.time')}
                </Label>
                {fieldError('time')}
              </div>
              <Select
                value={time}
                onValueChange={(next) => {
                  forgetConflict()
                  setTime(next)
                }}
              >
                <SelectTrigger
                  id="new-session-time"
                  className={cn('w-full', missing.includes('time') && 'border-danger')}
                >
                  <SelectValue placeholder="--:--" />
                </SelectTrigger>
                {/* Los tramos ocupados se MARCAN, no se deshabilitan: avisar,
                    no bloquear. Mismo criterio que en la ficha del alumno. */}
                <SelectContent>
                  {TIME_SLOTS.map((slot) => {
                    const ocupadoPor = findOverlappingSessions(sessionsOfDay, {
                      date: date === undefined ? '' : toLocalDateKey(date),
                      time: slot,
                      durationMinutes: Number(duration),
                    })

                    return (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                        {ocupadoPor.length > 0 && (
                          <span className="ms-2 text-xs text-warning">
                            {t('newSession.busySlot', { title: ocupadoPor[0].title })}
                          </span>
                        )}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="new-session-duration"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60"
              >
                {t('newSession.duration')}
              </Label>
              <Select
                value={duration}
                onValueChange={(next) => {
                  forgetConflict()
                  setDuration(next)
                }}
              >
                <SelectTrigger id="new-session-duration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((minutes) => (
                    <SelectItem key={minutes} value={minutes}>
                      {minutes} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
              {t('session.modality.label')}
            </Label>
            <SessionModalityPicker
              value={modality}
              onChange={(next) => {
                setModality(next)
                if (next === 'cardio') setRoutineId(NO_ROUTINE)
              }}
            />
          </div>

          {/*
            La rutina es OPCIONAL, y solo aparece en fuerza: una evaluacion
            inicial o una charla de seguimiento no ejecutan ninguna, y una salida
            a correr tampoco. Obligar a elegir convertiria «ninguna» en un valor
            que hay que buscar.
          */}
          {modality === 'strength' && (
          <div className="space-y-2">
            <Label
              htmlFor="new-session-routine"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60"
            >
              {t('newSession.routine')}
            </Label>
            <Select value={routineId} onValueChange={setRoutineId}>
              <SelectTrigger id="new-session-routine" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ROUTINE}>{t('newSession.noRoutine')}</SelectItem>
                {routines.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          )}

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label
                htmlFor="new-session-location"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60"
              >
                {t('newSession.location')}
              </Label>
              {fieldError('location')}
            </div>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger
                id="new-session-location"
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
            <Label
              htmlFor="new-session-notes"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60"
            >
              {t('newSession.notes')}{' '}
              <span className="font-normal normal-case text-ink/35">
                {t('newSession.optional')}
              </span>
            </Label>
            <Textarea
              id="new-session-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t('newSession.notesPlaceholder')}
              rows={3}
            />
          </div>

          {conflict !== null && (
            <ScheduleConflictNotice message={conflict} onOverride={scheduleSession} />
          )}

          <Button
            onClick={handleSubmit}
            className="h-14 w-full gap-2 font-display text-base font-extrabold uppercase tracking-[0.14em]"
          >
            <CalendarCheck className="size-5" />
            {t('newSession.submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
