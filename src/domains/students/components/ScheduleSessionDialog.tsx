import { useId, useState, type FormEvent } from 'react'
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
import { useAssignableRoutines } from '../hooks/useAssignableRoutines'
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

  const [routineId, setRoutineId] = useState(NO_ROUTINE)
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [missing, setMissing] = useState<FieldName[]>([])

  const resetForm = () => {
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

    const routine = routines.find((candidate) => candidate.id === routineId)

    await container.sessions.create({
      // El titulo lo pone la rutina cuando la hay. No lleva el nombre del alumno
      // dentro: se resuelve desde `studentId`, y meterlo aqui seria una copia
      // que envejece en cuanto el alumno se renombre.
      title: routine?.title ?? 'Sesión de entrenamiento',
      studentId: student.id,
      kind: 'individual',
      category: routine === undefined ? 'Entrenamiento' : 'Entrenamiento Personal',
      date: toDateKey(date!),
      time,
      durationMinutes: Number(duration),
      location,
      // Nace pendiente: confirmarla es un acto aparte.
      status: 'pending',
      notes,
      routineId: routineId === NO_ROUTINE ? null : routineId,
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
                onSelect={setDate}
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
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger
                  id={`${fieldId}-time`}
                  className={cn('w-full', missing.includes('time') && 'border-danger')}
                >
                  <SelectValue placeholder="--:--" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-duration`} className={FIELD_LABEL}>
                Duración
              </Label>
              <Select value={duration} onValueChange={setDuration}>
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

/**
 * Clave de fecha local, `YYYY-MM-DD`.
 *
 * No se usa `toISOString`: convierte a UTC y desplaza al día anterior toda
 * sesión de madrugada en husos negativos, que es el defecto de zona horaria que
 * este proyecto ya arregló una vez en el calendario.
 */
function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
