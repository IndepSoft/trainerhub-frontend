import { useState } from 'react'
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
// TODO: acoplamiento entre dominios. El calendario necesita la lista de
// alumnos, y hoy la pide directamente al hook de `students`. Lo correcto seria
// un puerto compartido; se hace asi porque la alternativa que habia era PEOR:
// este componente declaraba su propia lista escrita a mano -«María García»,
// «Pedro Rodríguez»- que no coincidia con los alumnos reales, de modo que se
// podian agendar sesiones con gente que no existe.
import { useStudents } from '@/domains/students/hooks/useStudents'
import { SESSION_LOCATIONS, TIME_SLOTS } from '../data/calendarOptions'

const SESSION_TYPES = [
  { value: 'personal', label: 'Entrenamiento personal', icon: User },
  { value: 'evaluation', label: 'Evaluación inicial', icon: User },
  { value: 'followup', label: 'Seguimiento', icon: User },
  { value: 'group', label: 'Clase grupal', icon: Users },
] as const

const DURATIONS = ['30', '45', '60', '90'] as const

/** Campos que la validación puede marcar. */
type FieldName = 'sessionType' | 'student' | 'date' | 'time' | 'location'

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
export function CreateSessionModal() {
  const { students } = useStudents()

  const [isOpen, setIsOpen] = useState(false)
  const [sessionType, setSessionType] = useState('')
  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [missing, setMissing] = useState<FieldName[]>([])

  const isGroupSession = sessionType === 'group'

  const resetForm = () => {
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
        faltan.length === 1
          ? 'Falta un campo por completar'
          : `Faltan ${faltan.length} campos por completar`
      )
      return
    }

    const student = students.find((candidate) => candidate.id === studentId)
    const quien = isGroupSession
      ? 'la clase grupal'
      : getShortName(student?.firstName, student?.lastName)

    // TODO: no persiste. Cuando exista el repositorio, aqui va la llamada.
    toast.success(
      `Sesión con ${quien} el ${date!.toLocaleDateString('es-ES')} a las ${time}`
    )

    resetForm()
    setIsOpen(false)
  }

  /** Marca de campo pendiente. Se muestra junto al campo, no sólo en un aviso. */
  const fieldError = (field: FieldName) =>
    missing.includes(field) ? (
      <span className="text-[11px] font-semibold text-danger">Falta este campo</span>
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
          Nueva Sesión
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            Nueva sesión
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/50">
            Elige el tipo, con quién y cuándo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-5 pb-5">
          <fieldset className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                Tipo
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
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* El alumno sólo tiene sentido en una sesión individual. */}
          {sessionType && !isGroupSession && (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                  Alumno
                </Label>
                {fieldError('student')}
              </div>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger
                  className={cn('w-full', missing.includes('student') && 'border-danger')}
                >
                  <SelectValue placeholder="Elige un alumno" />
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
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                Fecha
              </Label>
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
                <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                  Hora
                </Label>
                {fieldError('time')}
              </div>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger
                  className={cn('w-full', missing.includes('time') && 'border-danger')}
                >
                  <SelectValue placeholder="--:--" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                Duración
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-full">
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
            <div className="flex items-baseline justify-between gap-3">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                Ubicación
              </Label>
              {fieldError('location')}
            </div>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger
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
            <Label
              htmlFor="new-session-notes"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60"
            >
              Notas <span className="font-normal normal-case text-ink/35">(opcional)</span>
            </Label>
            <Textarea
              id="new-session-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Qué trabajar en esta sesión"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="h-14 w-full gap-2 font-display text-base font-extrabold uppercase tracking-[0.14em]"
          >
            <CalendarCheck className="size-5" />
            Programar sesión
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
