import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { cn } from '@/shared/lib/utils'
import { STUDENT_GOALS } from '../data/studentGoals'
import type { NewStudent } from '@/shared/domain/ports/StudentRepository'
import type { Student, StudentLevel } from '@/shared/domain/entities/student'

/** Registro de etiqueta del formulario, igual que en el resto de la aplicación. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60'

/** De menos a más exigente, que es como se lee una escala. */
const STUDENT_LEVELS: StudentLevel[] = ['Principiante', 'Intermedio', 'Avanzado']

/** Campos que la validación puede marcar. */
type FieldName = 'firstName' | 'lastName' | 'email'

interface StudentFormDialogProps {
  open: boolean
  /** El alumno que se edita, o `null` para dar uno de alta. */
  student: Student | null
  onOpenChange: (open: boolean) => void
  onSave: (data: NewStudent) => Promise<void>
}

/**
 * Alta y edición de un alumno.
 *
 * Un solo formulario para las dos cosas: lo único que cambia es de dónde sale el
 * estado inicial y qué se llama al guardar. Se monta con `key` desde quien lo
 * usa para que el borrador se reinicialice al cambiar de alumno.
 *
 * El CORREO importa más de lo que parece: es lo que enlazará al alumno con su
 * cuenta cuando se registre. Por eso es obligatorio aunque el alumno todavía no
 * vaya a entrar.
 */
export function StudentFormDialog({
  open,
  student,
  onOpenChange,
  onSave,
}: StudentFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {student === null ? 'Nuevo alumno' : 'Editar alumno'}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/50">
            {student === null
              ? 'Con su correo podrá entrar a ver su progreso cuando se registre.'
              : 'Los cambios se ven en su ficha, en la agenda y en el panel.'}
          </DialogDescription>
        </DialogHeader>

        <StudentFields
          key={student?.id ?? 'nuevo'}
          student={student}
          onSave={onSave}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

interface StudentFieldsProps {
  student: Student | null
  onSave: (data: NewStudent) => Promise<void>
  onCancel: () => void
}

function StudentFields({ student, onSave, onCancel }: StudentFieldsProps) {
  const fieldId = useId()

  const [firstName, setFirstName] = useState(student?.firstName ?? '')
  const [lastName, setLastName] = useState(student?.lastName ?? '')
  const [email, setEmail] = useState(student?.email ?? '')
  const [level, setLevel] = useState<StudentLevel>(student?.level ?? 'Principiante')
  const [age, setAge] = useState(student === undefined ? '' : String(student?.age ?? ''))
  const [bodyFat, setBodyFat] = useState(String(student?.bodyFatPercentage ?? ''))
  const [goals, setGoals] = useState<string[]>(student?.goals ?? [])
  const [missing, setMissing] = useState<FieldName[]>([])

  const toggleGoal = (goal: string) => {
    setGoals((current) =>
      current.includes(goal) ? current.filter((entry) => entry !== goal) : [...current, goal]
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const faltan: FieldName[] = []
    if (firstName.trim() === '') faltan.push('firstName')
    if (lastName.trim() === '') faltan.push('lastName')
    if (email.trim() === '') faltan.push('email')

    setMissing(faltan)
    if (faltan.length > 0) return

    await onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      level,
      goals,
      // Los números en blanco valen cero: la edad y el porcentaje graso son
      // datos que se toman después, y exigirlos para dar de alta a alguien
      // convertiría el alta en una consulta.
      age: Number.parseInt(age, 10) || 0,
      bodyFatPercentage: Number.parseInt(bodyFat, 10) || 0,
      // Se conserva el enlace a la cuenta al editar: no es del formulario.
      profileId: student?.profileId ?? null,
      /*
       * Una ficha nueva nace INVITADA, no activa: existe y espera a que su
       * dueño se registre con ese correo. Al editar se conserva la que tenga,
       * porque aprobar a alguien es una decision aparte y no debe ocurrir de
       * rebote al corregirle la edad.
       */
      membershipStatus: student?.membershipStatus ?? 'invited',
      // Se conservan al editar: los permisos no son del formulario de la ficha,
      // se dan desde la gestion de personas del equipo.
      extraCapabilities: student?.extraCapabilities ?? [],
    })

    onCancel()
  }

  const fieldError = (field: FieldName) =>
    missing.includes(field) ? (
      <span className="text-[11px] font-semibold text-danger">Falta este campo</span>
    ) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={`${fieldId}-first`} className={FIELD_LABEL}>
              Nombre
            </Label>
            {fieldError('firstName')}
          </div>
          <Input
            id={`${fieldId}-first`}
            className={cn('mt-1.5', missing.includes('firstName') && 'border-danger')}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={`${fieldId}-last`} className={FIELD_LABEL}>
              Apellidos
            </Label>
            {fieldError('lastName')}
          </div>
          <Input
            id={`${fieldId}-last`}
            className={cn('mt-1.5', missing.includes('lastName') && 'border-danger')}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor={`${fieldId}-email`} className={FIELD_LABEL}>
            Correo
          </Label>
          {fieldError('email')}
        </div>
        <Input
          id={`${fieldId}-email`}
          type="email"
          className={cn('mt-1.5', missing.includes('email') && 'border-danger')}
          placeholder="alumno@correo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <p className="mt-1 text-xs text-ink/40">
          Con este correo se enlazará su cuenta cuando se registre.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={`${fieldId}-level`} className={FIELD_LABEL}>
            Nivel
          </Label>
          <Select value={level} onValueChange={(value) => setLevel(value as StudentLevel)}>
            <SelectTrigger id={`${fieldId}-level`} className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STUDENT_LEVELS.map((candidate) => (
                <SelectItem key={candidate} value={candidate}>
                  {candidate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`${fieldId}-age`} className={FIELD_LABEL}>
            Edad
          </Label>
          <Input
            id={`${fieldId}-age`}
            type="number"
            inputMode="numeric"
            min={0}
            className="mt-1.5"
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />
        </div>

        <div>
          <Label htmlFor={`${fieldId}-fat`} className={FIELD_LABEL}>
            Grasa (%)
          </Label>
          <Input
            id={`${fieldId}-fat`}
            type="number"
            inputMode="numeric"
            min={0}
            className="mt-1.5"
            value={bodyFat}
            onChange={(event) => setBodyFat(event.target.value)}
          />
        </div>
      </div>

      {/* Conmutadores y no texto libre: los objetivos se usan para filtrar y
          agrupar, y escritos a mano cada uno pondría el suyo. */}
      <div role="group" aria-label="Objetivos">
        <span className={cn('block', FIELD_LABEL)}>Objetivos</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {STUDENT_GOALS.map((goal) => {
            const isSelected = goals.includes(goal)

            return (
              <button
                key={goal}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleGoal(goal)}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-action border px-3 text-xs font-semibold transition-colors',
                  isSelected
                    ? 'border-cobalt/50 bg-cobalt-tint text-cobalt'
                    : 'border-cobalt-tint-3 text-ink/50 hover:border-cobalt/40 hover:text-ink'
                )}
              >
                {goal}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{student === null ? 'Añadir alumno' : 'Guardar cambios'}</Button>
      </div>
    </form>
  )
}
