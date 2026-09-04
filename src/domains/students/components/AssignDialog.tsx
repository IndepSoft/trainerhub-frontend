import { useId, useState, type FormEvent } from 'react'
import { CalendarRange, Dumbbell, type LucideIcon } from 'lucide-react'
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
import { useAssignableRoutines } from '../hooks/useAssignableRoutines'
import { useAssignablePlans } from '../hooks/useAssignablePlans'
import { toDateKey } from '../libs/dateKey'
import type { NewAssignment, AssignmentKind } from '@/shared/domain/entities/assignment'
import type { Student } from '@/shared/domain/entities/student'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/** Registro de etiqueta del formulario, igual que en el resto de la aplicación. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60'

interface AssignDialogProps {
  student: Student
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (data: NewAssignment) => Promise<void>
}

/**
 * Asignarle una rutina o un plan a un alumno. Sólo presentación y estado local.
 *
 * NO AGENDA NADA. Asignar dice «esto es tuyo»; poner las sesiones en el
 * calendario es otra acción, opcional, que se hace después desde el plan ya
 * asignado. Mezclarlas obligaría a fijar horarios para poder asignar, y hay
 * quien asigna un plan para que el alumno lo siga por su cuenta.
 */
export function AssignDialog({ student, open, onOpenChange, onAssign }: AssignDialogProps) {
  const { t } = useTranslation()
  const fieldId = useId()
  const { routines } = useAssignableRoutines()
  const { plans } = useAssignablePlans()

  const [kind, setKind] = useState<AssignmentKind>('plan')
  const [targetId, setTargetId] = useState('')
  const [startDate, setStartDate] = useState<Date>()
  const [notes, setNotes] = useState('')
  const [missingTarget, setMissingTarget] = useState(false)

  const isPlan = kind === 'plan'

  const resetForm = () => {
    setKind('plan')
    setTargetId('')
    setStartDate(undefined)
    setNotes('')
    setMissingTarget(false)
  }

  /** Cambiar de tipo vacía la elección: un plan no vale como rutina. */
  const changeKind = (next: AssignmentKind) => {
    setKind(next)
    setTargetId('')
    setStartDate(undefined)
    setMissingTarget(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (targetId === '') {
      setMissingTarget(true)
      return
    }

    const assignedOn = toDateKey(new Date())

    await onAssign(
      isPlan
        ? {
            kind: 'plan',
            studentId: student.id,
            planId: targetId,
            assignedOn,
            // Sin fecha de inicio es un estado válido: «éste es tu programa, ya
            // veremos cuándo empiezas».
            startDate: startDate === undefined ? null : toDateKey(startDate),
            notes,
          }
        : {
            kind: 'routine',
            studentId: student.id,
            routineId: targetId,
            assignedOn,
            notes,
          }
    )

    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) resetForm()
      }}
    >
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {t('assign.title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/50">
            {t('assign.hint', { name: `${student.firstName} ${student.lastName}` })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-5">
          {/*
            Dos conmutadores con `aria-pressed` y no un desplegable: son dos
            opciones y cambian el resto del formulario, asi que conviene verlas
            las dos a la vez.
          */}
          <div role="group" aria-label={t('assign.whatLabel')}>
            <span className={cn('block', FIELD_LABEL)}>{t('assign.what')}</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <KindOption
                icon={CalendarRange}
                label={t('assign.plan')}
                isSelected={isPlan}
                onSelect={() => changeKind('plan')}
              />
              <KindOption
                icon={Dumbbell}
                label={t('assign.routine')}
                isSelected={!isPlan}
                onSelect={() => changeKind('routine')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor={`${fieldId}-target`} className={FIELD_LABEL}>
                {isPlan ? t('assign.plan') : t('assign.routine')}
              </Label>
              {missingTarget && (
                <span className="text-[11px] font-semibold text-danger">{t('common.missingField')}</span>
              )}
            </div>
            <Select
              value={targetId}
              onValueChange={(next) => {
                setMissingTarget(false)
                setTargetId(next)
              }}
            >
              <SelectTrigger
                id={`${fieldId}-target`}
                className={cn('w-full', missingTarget && 'border-danger')}
              >
                <SelectValue placeholder={isPlan ? t('assign.pickPlan') : t('assign.pickRoutine')} />
              </SelectTrigger>
              <SelectContent>
                {isPlan
                  ? plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.title}
                      </SelectItem>
                    ))
                  : routines.map((routine) => (
                      <SelectItem key={routine.id} value={routine.id}>
                        {routine.title}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          {/*
            La fecha de inicio solo tiene sentido en un plan: es desde cuando
            cuenta su semana 1. Una rutina suelta es repertorio disponible, no
            algo que empiece un dia.
          */}
          {isPlan && (
            <div className="space-y-2">
              <span className={cn('block', FIELD_LABEL)}>{t('assign.startDate')}</span>
              <p className="text-xs text-ink/40">
                {t('assign.startDateHint')}
              </p>
              <div className="rounded-block border border-cobalt-tint-3 p-2">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  className="mx-auto"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-notes`} className={FIELD_LABEL}>
              {t('newSession.notes')}
            </Label>
            <Textarea
              id={`${fieldId}-notes`}
              rows={2}
              placeholder={t('assign.notesPlaceholder')}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="h-14 w-full gap-2 font-display text-base font-extrabold uppercase tracking-[0.14em]"
          >
            {t('assign.title')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface KindOptionProps {
  icon: LucideIcon
  label: string
  isSelected: boolean
  onSelect: () => void
}

function KindOption({ icon: Icon, label, isSelected, onSelect }: KindOptionProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-action border px-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors',
        isSelected
          ? 'border-ember/50 bg-ember/10 text-ember-deep'
          : 'border-cobalt-tint-3 text-ink/45 hover:border-cobalt/40 hover:text-ink'
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}
