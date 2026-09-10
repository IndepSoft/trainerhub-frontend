import { useEffect, useId, useState, type FormEvent } from 'react'
import { CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { container } from '@/app/container'
import { describeError } from '@/shared/i18n/errorMessages'
import { activeLocale } from '@/shared/i18n/activeLocale'
import { ScheduleConflictNotice } from '@/shared/components/ScheduleConflictNotice'
import {
  NO_ROUTINE,
  SessionScheduleFields,
  type SessionFieldName,
  type SessionScheduleValue,
} from '@/shared/components/SessionScheduleFields'
import { describeOverlap, findOverlappingSessions } from '@/shared/domain/sessionScheduling'
import { useAssignableRoutines } from '../hooks/useAssignableRoutines'
import { toDateKey } from '../libs/dateKey'
import type { Session } from '@/shared/domain/entities/session'
import type { Student } from '@/shared/domain/entities/student'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface ScheduleSessionDialogProps {
  student: Student
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY_VALUE: SessionScheduleValue = {
  modality: 'strength',
  routineId: NO_ROUTINE,
  date: undefined,
  time: '',
  duration: '60',
  location: '',
  notes: '',
}

/**
 * Agendar una sesión para un alumno concreto. Sólo presentación y estado local.
 *
 * NO es el formulario de la agenda con otro nombre: el de la agenda empieza
 * preguntando de quién es la sesión, y aquí eso ya está decidido —se entra
 * desde su ficha—. Lo que los dos preguntan igual —cuándo, cuánto, dónde, qué—
 * es `SessionScheduleFields`, compartido; aquí queda la cabecera, la
 * validación y la escritura.
 *
 * Escribe por el puerto, así que la sesión aparece a la vez aquí y en el
 * calendario sin que ninguno de los dos dominios sepa del otro.
 */
export function ScheduleSessionDialog({
  student,
  open,
  onOpenChange,
}: ScheduleSessionDialogProps) {
  const { t } = useTranslation()
  const fieldId = useId()
  const { routines } = useAssignableRoutines()

  const [value, setValue] = useState<SessionScheduleValue>(EMPTY_VALUE)
  const [missing, setMissing] = useState<SessionFieldName[]>([])
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
    if (value.date === undefined) {
      setSessionsOfDay([])
      return
    }

    let active = true
    container.sessions.findByDate(toDateKey(value.date)).then((result) => {
      if (active) setSessionsOfDay(result)
    })

    return () => {
      active = false
    }
  }, [value.date])

  /** Un choque deja de serlo en cuanto cambia alguna de las tres piezas. */
  const handleChange = (changes: Partial<SessionScheduleValue>) => {
    if ('date' in changes || 'time' in changes || 'duration' in changes) setConflict(null)
    setValue((current) => ({ ...current, ...changes }))
  }

  const resetForm = () => {
    setConflict(null)
    setValue(EMPTY_VALUE)
    setMissing([])
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const faltan: SessionFieldName[] = []
    if (value.date === undefined) faltan.push('date')
    if (value.time === '') faltan.push('time')
    if (value.location === '') faltan.push('location')

    setMissing(faltan)
    if (faltan.length > 0 || value.date === undefined) return

    /*
     * Se relee del puerto en vez de usar `sessionsOfDay`: entre elegir la hora y
     * pulsar puede haberse agendado algo, y ademas la lista se cargo con la
     * duracion de entonces. Esta es la comprobacion que vale.
     */
    const sameDay = await container.sessions.findByDate(toDateKey(value.date))
    const choques = findOverlappingSessions(sameDay, {
      date: toDateKey(value.date),
      time: value.time,
      durationMinutes: Number(value.duration),
    })

    if (choques.length > 0) {
      setConflict(describeOverlap(choques))
      return
    }

    await scheduleSession()
  }

  /**
   * El alta, ya sin comprobaciones: la decisión está tomada.
   *
   * SE ESPERA AL PUERTO Y SE DICE, como en el formulario de la agenda. Aqui
   * la promesa rechazada se perdia: la base decia que no y el dialogo se
   * quedaba abierto sin explicacion; y el exito se cerraba sin confirmar
   * nada. Los dos formularios agendan lo mismo y tienen que responder igual.
   */
  const scheduleSession = async () => {
    if (value.date === undefined) return
    const routine = routines.find((candidate) => candidate.id === value.routineId)

    try {
      await container.sessions.create({
        // El titulo lo pone la rutina cuando la hay. No lleva el nombre del
        // alumno dentro: se resuelve desde `studentId`, y meterlo aqui seria
        // una copia que envejece en cuanto el alumno se renombre.
        title: routine?.title ?? t('scheduleSession.defaultTitle'),
        studentId: student.id,
        kind: 'individual',
        modality: value.modality,
        /* Se guarda, asi que queda en el idioma de quien agendo. Ver el mismo
           comentario en `CreateSessionModal`. */
        category:
          routine === undefined ? t('scheduleSession.category') : t('scheduleSession.personal'),
        date: toDateKey(value.date),
        time: value.time,
        durationMinutes: Number(value.duration),
        location: value.location,
        // Nace pendiente: confirmarla es un acto aparte.
        status: 'pending',
        notes: value.notes,
        routineId:
          value.modality === 'cardio' || value.routineId === NO_ROUTINE ? null : value.routineId,
        // Nace sin resultado: no ha ocurrido todavia.
        result: null,
      })
    } catch (caught) {
      toast.error(describeError(caught, t, 'newSession.error'))
      return
    }

    toast.success(
      t('scheduleSession.scheduled', {
        name: student.firstName,
        date: value.date.toLocaleDateString(activeLocale()),
        time: value.time,
      })
    )
    resetForm()
    onOpenChange(false)
  }

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
            {t('scheduleSession.title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/50">
            {t('scheduleSession.hint', { name: `${student.firstName} ${student.lastName}` })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-5">
          <SessionScheduleFields
            idPrefix={fieldId}
            value={value}
            onChange={handleChange}
            routines={routines}
            sessionsOfDay={sessionsOfDay}
            missing={missing}
            notesPlaceholder={t('scheduleSession.notesPlaceholder')}
          />

          {conflict !== null && (
            <ScheduleConflictNotice message={conflict} onOverride={() => void scheduleSession()} />
          )}

          <Button
            type="submit"
            className="h-14 w-full gap-2 font-display text-base font-extrabold uppercase tracking-[0.14em]"
          >
            <CalendarCheck className="size-5" />
            {t('scheduleSession.title')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
