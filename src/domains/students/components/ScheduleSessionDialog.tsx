import { useEffect, useId, useState, type FormEvent } from 'react'
import { CalendarCheck } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
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
import { container } from '@/app/container'
import {
  SESSION_DURATIONS,
  SESSION_LOCATIONS,
  SESSION_TIME_SLOTS,
} from '@/shared/domain/entities/session'
import { ScheduleConflictNotice } from '@/shared/components/ScheduleConflictNotice'
import { SessionModalityPicker } from '@/shared/components/SessionModalityPicker'
import { describeOverlap, findOverlappingSessions } from '@/shared/domain/sessionScheduling'
import { useAssignableRoutines } from '../hooks/useAssignableRoutines'
import { toDateKey } from '../libs/dateKey'
import type { Session, SessionModality } from '@/shared/domain/entities/session'
import type { Student } from '@/shared/domain/entities/student'

/** Registro de etiqueta del formulario, igual que en el resto de la aplicación. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60'

/**
 * Valor cuando la sesión no ejecuta ninguna rutina. No puede ser la cadena
 * vacía: Radix la reserva para «sin seleccionar».
 */
const NO_ROUTINE = 'sin-rutina'

/** Campos que la validación puede marcar. */
type FieldName = 'date' | 'time' | 'location'

interface ScheduleSessionDialogProps {
  student: Student
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Agendar una sesión para un alumno concreto. Sólo presentación y estado local.
 *
 * NO es el formulario de la agenda con otro nombre, y por eso no se comparte: el
 * de la agenda empieza preguntando de quién es la sesión, y aquí eso ya está
 * decidido —se entra desde su ficha—. Lo que se elige es cuándo y qué se hace.
 * Un componente compartido habría tenido que llevar dentro las dos formas.
 *
 * Escribe por el puerto, así que la sesión aparece a la vez aquí y en el
 * calendario sin que ninguno de los dos dominios sepa del otro.
 */
export function ScheduleSessionDialog({
  student,
  open,
  onOpenChange,
}: ScheduleSessionDialogProps) {
  const fieldId = useId()
  const { routines } = useAssignableRoutines()

  const [modality, setModality] = useState<SessionModality>('strength')
  const [routineId, setRoutineId] = useState(NO_ROUTINE)
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

  /*
   * Se cargan las sesiones del dia elegido, no la agenda entera: `findByDate` es
   * una consulta acotada, y con backend real comprobar un choque no puede
   * significar descargar todo.
   */
  useEffect(() => {
    if (date === undefined) {
      setSessionsOfDay([])
      return
    }

    let active = true
    container.sessions.findByDate(toDateKey(date)).then((result) => {
      if (active) setSessionsOfDay(result)
    })

    return () => {
      active = false
    }
  }, [date])

  /** Un choque deja de serlo en cuanto cambia alguna de las tres piezas. */
  const forgetConflict = () => setConflict(null)

  const resetForm = () => {
    setConflict(null)
    setModality('strength')
    setRoutineId(NO_ROUTINE)
    setDate(undefined)
    setTime('')
    setDuration('60')
    setLocation('')
    setNotes('')
    setMissing([])
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const faltan: FieldName[] = []
    if (!date) faltan.push('date')
    if (!time) faltan.push('time')
    if (!location) faltan.push('location')

    setMissing(faltan)
    if (faltan.length > 0) return

    /*
     * Se relee del puerto en vez de usar `sessionsOfDay`: entre elegir la hora y
     * pulsar puede haberse agendado algo, y ademas la lista se cargo con la
     * duracion de entonces. Esta es la comprobacion que vale.
     */
    const sameDay = await container.sessions.findByDate(toDateKey(date!))
    const choques = findOverlappingSessions(sameDay, {
      date: toDateKey(date!),
      time,
      durationMinutes: Number(duration),
    })

    if (choques.length > 0) {
      setConflict(describeOverlap(choques))
      return
    }

    await scheduleSession()
  }

  /** El alta, ya sin comprobaciones: la decisión está tomada. */
  const scheduleSession = async () => {
    const routine = routines.find((candidate) => candidate.id === routineId)

    await container.sessions.create({
      // El titulo lo pone la rutina cuando la hay. No lleva el nombre del alumno
      // dentro: se resuelve desde `studentId`, y meterlo aqui seria una copia
      // que envejece en cuanto el alumno se renombre.
      title: routine?.title ?? 'Sesión de entrenamiento',
      studentId: student.id,
      kind: 'individual',
      modality,
      category: routine === undefined ? 'Entrenamiento' : 'Entrenamiento Personal',
      date: toDateKey(date!),
      time,
      durationMinutes: Number(duration),
      location,
      // Nace pendiente: confirmarla es un acto aparte.
      status: 'pending',
      notes,
      // Una sesion de cardio no ejecuta una rutina de sala, aunque hubiera uno
      // elegido antes de cambiar de modalidad.
      routineId: modality === 'cardio' || routineId === NO_ROUTINE ? null : routineId,
    })

    resetForm()
    onOpenChange(false)
  }

  const fieldError = (field: FieldName) =>
    missing.includes(field) ? (
      <span className="text-[11px] font-semibold text-danger">Falta este campo</span>
    ) : null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setMissing([])
      }}
    >
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            Agendar sesión
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/50">
            Para {student.firstName} {student.lastName}. Aparecerá en el calendario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-5">
          <div className="space-y-2">
            <span className={cn('block', FIELD_LABEL)}>Tipo de entrenamiento</span>
            <SessionModalityPicker
              value={modality}
              onChange={(next) => {
                setModality(next)
                if (next === 'cardio') setRoutineId(NO_ROUTINE)
              }}
            />
          </div>

          {/* El selector de rutina solo aparece en fuerza: una salida a correr
              no ejecuta bloques ni series. */}
          {modality === 'strength' && (
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-routine`} className={FIELD_LABEL}>
              Rutina
            </Label>
            <Select value={routineId} onValueChange={setRoutineId}>
              <SelectTrigger id={`${fieldId}-routine`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ROUTINE}>Sin rutina</SelectItem>
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
              <span className={FIELD_LABEL}>Fecha</span>
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
                // No se agenda en el pasado: una sesión que nace vencida no
                // sirve para nada.
                disabled={(candidate) => candidate < new Date(new Date().setHours(0, 0, 0, 0))}
                className="mx-auto"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={`${fieldId}-time`} className={FIELD_LABEL}>
                  Hora
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
                  id={`${fieldId}-time`}
                  className={cn('w-full', missing.includes('time') && 'border-danger')}
                >
                  <SelectValue placeholder="--:--" />
                </SelectTrigger>
                {/*
                  Los tramos ocupados se MARCAN, no se deshabilitan: la decision
                  sigue siendo del entrenador. Y contestan por adelantado la
                  pregunta que de verdad se hace -«¿cuando le meto?»- en vez de
                  regañarle despues de elegir.
                */}
                <SelectContent>
                  {SESSION_TIME_SLOTS.map((slot) => {
                    const ocupadoPor = findOverlappingSessions(sessionsOfDay, {
                      date: date === undefined ? '' : toDateKey(date),
                      time: slot,
                      durationMinutes: Number(duration),
                    })

                    return (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                        {ocupadoPor.length > 0 && (
                          <span className="ms-2 text-xs text-warning">
                            ocupado · {ocupadoPor[0].title}
                          </span>
                        )}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-duration`} className={FIELD_LABEL}>
                Duración
              </Label>
              <Select
                value={duration}
                onValueChange={(next) => {
                  forgetConflict()
                  setDuration(next)
                }}
              >
                <SelectTrigger id={`${fieldId}-duration`} className="w-full">
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
              <Label htmlFor={`${fieldId}-location`} className={FIELD_LABEL}>
                Ubicación
              </Label>
              {fieldError('location')}
            </div>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger
                id={`${fieldId}-location`}
                className={cn('w-full', missing.includes('location') && 'border-danger')}
              >
                <SelectValue placeholder="Elige una ubicación" />
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
            <Label htmlFor={`${fieldId}-notes`} className={FIELD_LABEL}>
              Notas
            </Label>
            <Textarea
              id={`${fieldId}-notes`}
              rows={2}
              placeholder="Qué trabajar, avisos, material…"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {conflict !== null && (
            <ScheduleConflictNotice message={conflict} onOverride={() => void scheduleSession()} />
          )}

          <Button
            type="submit"
            className="h-14 w-full gap-2 font-display text-base font-extrabold uppercase tracking-[0.14em]"
          >
            <CalendarCheck className="size-5" />
            Agendar sesión
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
