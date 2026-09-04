import { useEffect, useId, useMemo, useState } from 'react'
import { AlertTriangle, CalendarCheck } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { cn } from '@/shared/lib/utils'
import { container } from '@/app/container'
import { SESSION_LOCATIONS, SESSION_TIME_SLOTS } from '@/shared/domain/entities/session'
import {
  countConflicting,
  planSessions,
  weekdaysUsedBy,
  type PlannedSession,
  type TimesByWeekday,
} from '@/shared/domain/planScheduling'
import { useAssignableRoutines } from '../hooks/useAssignableRoutines'
import { formatDateKey } from '../libs/dateKey'
import type { Session } from '@/shared/domain/entities/session'
import type { TrainingPlan } from '@/shared/domain/entities/plan'
import type { Student } from '@/shared/domain/entities/student'
import { activeLocale } from '@/shared/i18n/activeLocale'
import { useTranslation, type Translate } from '@/shared/i18n/LanguageContext'

/** Registro de etiqueta del formulario, igual que en el resto de la aplicación. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60'

/** `1` → «lunes». Anclado a un lunes conocido, como en el resto del proyecto. */
const MONDAY_ANCHOR = Date.UTC(2024, 0, 1)

function weekdayName(dayOfWeek: number): string {
  const date = new Date(MONDAY_ANCHOR + (dayOfWeek - 1) * 86_400_000)
  return date.toLocaleDateString(activeLocale(), { weekday: 'long', timeZone: 'UTC' })
}

interface PlanToAgendaDialogProps {
  student: Student
  plan: TrainingPlan
  /** Desde cuándo cuenta la semana 1. */
  startDate: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Volcar un plan asignado a la agenda. Sólo presentación y estado local.
 *
 * Es la tercera acción, la que convierte «éste es tu programa» en huecos
 * reservados. Se mantiene separada de asignar a propósito: hay quien asigna un
 * plan para que el alumno lo siga por su cuenta, y mezclarlas obligaría a fijar
 * horarios para poder asignar.
 *
 * PIDE UNA HORA POR DÍA DE LA SEMANA, no una para todas ni una por sesión. Es lo
 * que un entrenador ya tiene en la cabeza —«María viene lunes, miércoles y
 * viernes a las siete»— y para un full body son tres campos que producen doce
 * sesiones bien puestas.
 *
 * Y ENSEÑA LA PREVIA ANTES DE CONFIRMAR. Generar doce sesiones a ciegas sería
 * una máquina de fabricar dobles reservas; la previa las lista, marca las que
 * chocan y deja arreglar las horas antes de crear nada.
 */
export function PlanToAgendaDialog({
  student,
  plan,
  startDate,
  open,
  onOpenChange,
}: PlanToAgendaDialogProps) {
  const { t, plural } = useTranslation()
  const fieldId = useId()
  const { routines } = useAssignableRoutines()

  const weekdays = useMemo(() => weekdaysUsedBy(plan), [plan])
  const routinesById = useMemo(
    () => new Map(routines.map((routine) => [routine.id, routine])),
    [routines]
  )

  const [timesByWeekday, setTimesByWeekday] = useState<TimesByWeekday>({})
  const [location, setLocation] = useState(SESSION_LOCATIONS[0])
  const [existingSessions, setExistingSessions] = useState<Session[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const planned: PlannedSession[] = useMemo(() => {
    // Sin ninguna hora elegida no hay nada que previsualizar.
    if (Object.keys(timesByWeekday).length === 0) return []

    return planSessions(
      { plan, studentId: student.id, startDate, timesByWeekday, location, routinesById },
      existingSessions
    )
  }, [plan, student.id, startDate, timesByWeekday, location, routinesById, existingSessions])

  /*
   * Se cargan las sesiones del INTERVALO que abarca el plan, no la agenda
   * entera: son cuatro semanas, y con backend real la diferencia es una consulta
   * acotada frente a descargarlo todo.
   */
  useEffect(() => {
    if (!open) return

    const lastWeek = plan.weeks.length
    const to = addWeeks(startDate, lastWeek)

    let active = true
    container.sessions.findBetween(startDate, to).then((result) => {
      if (active) setExistingSessions(result)
    })

    return () => {
      active = false
    }
  }, [open, plan.weeks.length, startDate])

  const conflicting = countConflicting(planned)

  /*
   * LOS DÍAS SIN HORA NO SE AGENDAN, Y HAY QUE DECIRLO.
   *
   * `planSessions` los descarta en silencio —sin hora no hay sesión que
   * construir—, y eso convertía un descuido en un misterio: quien rellenaba una
   * sola hora obtenía una fecha y ninguna pantalla explicaba dónde estaban las
   * demás. El recuento del botón dice CUÁNTAS salen; esto dice POR QUÉ no salen
   * más, que es la pregunta que se hace de verdad.
   */
  const missingWeekdays = weekdays.filter((dayOfWeek) => timesByWeekday[dayOfWeek] === undefined)
  const chosenCount = weekdays.length - missingWeekdays.length

  const handleConfirm = async () => {
    setIsSaving(true)
    // En serie y no en paralelo: el adaptador reemplaza su lista entera en cada
    // alta, así que doce promesas a la vez se pisarían y sólo quedaría una.
    for (const entry of planned) {
      await container.sessions.create(entry.session)
    }
    setIsSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {t('planDump.title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/50">
            {t('planDump.hint', {
              plan: plan.title,
              name: student.firstName,
              date: formatDateKey(startDate),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 pb-5">
          <div className="space-y-3">
            <span className={cn('block', FIELD_LABEL)}>{t('planDump.timePerDay')}</span>
            <p className="text-xs text-ink/50">
              {/* La forma del plan, en una línea: es de donde sale el total, y
                  sin ella el número del botón parece salir de la nada. Un plan
                  de una semana produce pocas sesiones y eso sorprende si no se
                  ve escrito que tiene una. */}
              {t('planDump.shape', {
                weeks: plural(
                  'planDump.weekCount.one',
                  'planDump.weekCount.other',
                  plan.weeks.length,
                  { count: plan.weeks.length }
                ),
                days: plural('planDump.dayCount.one', 'planDump.dayCount.other', weekdays.length, {
                  count: weekdays.length,
                }),
              })}
            </p>
            {weekdays.map((dayOfWeek) => (
              <div key={dayOfWeek} className="flex items-center gap-3">
                <Label
                  htmlFor={`${fieldId}-day-${dayOfWeek}`}
                  className="w-24 shrink-0 text-sm capitalize text-ink/70"
                >
                  {weekdayName(dayOfWeek)}
                </Label>
                <Select
                  value={timesByWeekday[dayOfWeek] ?? ''}
                  onValueChange={(time) =>
                    setTimesByWeekday((current) => ({ ...current, [dayOfWeek]: time }))
                  }
                >
                  <SelectTrigger id={`${fieldId}-day-${dayOfWeek}`} className="w-full">
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
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-location`} className={FIELD_LABEL}>
              {t('newSession.location')}
            </Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id={`${fieldId}-location`} className="w-full">
                <SelectValue />
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

          {/*
            El aviso va antes de la previa, no dentro: se refiere a lo que NO
            está en la lista, y ponerlo debajo obligaría a leer la lista entera
            para descubrir que falta algo.
          */}
          {chosenCount > 0 && missingWeekdays.length > 0 && (
            <p className="flex items-start gap-2 rounded-block border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-ink/70">
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warning" />
              <span>
                {t('planDump.missingTimes', { days: describeWeekdays(missingWeekdays, t) })}
              </span>
            </p>
          )}

          {planned.length === 0 ? (
            <p className="rounded-block border border-cobalt-tint-3 px-4 py-6 text-center text-sm text-ink/45">
              {t('planDump.pickAtLeastOne')}
            </p>
          ) : (
            <div>
              <p className="metric-figures mb-2 flex flex-wrap items-baseline gap-x-3 text-sm text-ink/60">
                <span className="font-semibold text-ink">
                  {t('planDump.sessionCount', { count: planned.length })}
                </span>
                {conflicting > 0 && (
                  <span className="flex items-center gap-1.5 text-warning">
                    <AlertTriangle aria-hidden="true" className="size-3.5" />
                    {t('planDump.conflicting', { count: conflicting })}
                  </span>
                )}
              </p>

              {/* La previa se desplaza sola: doce sesiones no caben en un
                  diálogo sin empujar el botón de confirmar fuera de la vista. */}
              <ul className="max-h-64 divide-y divide-cobalt-tint-3 overflow-y-auto rounded-block border border-cobalt-tint-3">
                {planned.map((entry) => (
                  <li
                    key={`${entry.session.date}-${entry.session.time}`}
                    className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate text-ink/70">
                      {entry.session.title}
                    </span>
                    <span
                      className={cn(
                        'metric-figures shrink-0 text-xs',
                        entry.conflicts.length > 0 ? 'text-warning' : 'text-ink/40'
                      )}
                    >
                      {formatDateKey(entry.session.date)} · {entry.session.time}
                      {entry.conflicts.length > 0 && t('planDump.busy')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            type="button"
            disabled={planned.length === 0 || isSaving}
            onClick={() => void handleConfirm()}
            className="h-14 w-full gap-2 font-display text-base font-extrabold uppercase tracking-[0.14em]"
          >
            <CalendarCheck className="size-5" />
            {planned.length === 0
              ? t('planDump.confirm')
              : t('planDump.confirmCount', { count: planned.length })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Suma semanas a una clave de fecha, construyéndola por partes. */
function addWeeks(dateKey: string, weeks: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const result = new Date(year, month - 1, day + weeks * 7)
  const resultMonth = String(result.getMonth() + 1).padStart(2, '0')
  const resultDay = String(result.getDate()).padStart(2, '0')
  return `${result.getFullYear()}-${resultMonth}-${resultDay}`
}

/**
 * «miércoles, jueves y viernes».
 *
 * Con «y» antes del último y no una lista separada por comas hasta el final: se
 * lee como una frase porque va dentro de una, no como un volcado de datos.
 */
function describeWeekdays(weekdays: number[], t: Translate): string {
  const names = weekdays.map(weekdayName)
  if (names.length <= 1) return names.join('')

  const last = names[names.length - 1]
  return t('planDump.and', { list: names.slice(0, -1).join(', '), last })
}
