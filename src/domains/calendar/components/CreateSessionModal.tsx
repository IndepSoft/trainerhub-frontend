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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { CalendarCheck, Plus, User, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { describeError } from '@/shared/i18n/errorMessages'
import { getShortName } from '@/shared/lib/personName'
import { useSchedulableStudents } from '../hooks/useSchedulableStudents'
import { useSchedulableRoutines } from '../hooks/useSchedulableRoutines'
import { container } from '@/app/container'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import { activeLocale } from '@/shared/i18n/activeLocale'
import { ScheduleConflictNotice } from '@/shared/components/ScheduleConflictNotice'
import {
  NO_ROUTINE,
  SessionScheduleFields,
  type SessionFieldName,
  type SessionScheduleValue,
} from '@/shared/components/SessionScheduleFields'
import { parseLocalDateKey } from '../libs/calendar.utils'
import type { Translate } from '@/shared/i18n/LanguageContext'
import { describeOverlap, findOverlappingSessions } from '@/shared/domain/sessionScheduling'
import type { Session } from '@/shared/domain/entities/session'
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

/**
 * El tipo con el que se creó una sesión, recuperado para editarla.
 *
 * La sesión no guarda el tipo sino su ETIQUETA traducida como categoría, así
 * que se busca por etiqueta. Una grupal se reconoce por `kind`, que sí se
 * guarda; una etiqueta que no case —otro idioma, otra versión— cae en
 * «personal», que es lo que era casi siempre.
 */
function sessionTypeOf(session: Session, t: Translate): string {
  if (session.kind === 'group') return 'group'
  const match = SESSION_TYPES.find((type) => t(type.labelKey) === session.category)
  return match?.value ?? 'personal'
}

/** Campos que la validación puede marcar: los propios de aquí, y los compartidos. */
type FieldName = 'sessionType' | 'student' | SessionFieldName

const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60'

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
 *
 * Y una cuarta, después: lo que pregunta igual que la ficha del alumno
 * —cuándo, cuánto, dónde, qué— es `SessionScheduleFields`, compartido. Aquí
 * queda lo que sólo se decide en la agenda: el tipo y de quién es.
 */
interface CreateSessionModalProps {
  /**
   * Rutina con la que abrir el formulario ya elegida.
   *
   * Es lo que hace posible «Usar en una sesión»: la ficha de la rutina navega a
   * la agenda con su identificador, y el alta arranca con esa rutina puesta.
   */
  preselectedRoutineId?: string
  /**
   * La sesión que se edita. Con ella, el formulario arranca relleno, no
   * pinta su propio disparador y al enviar ACTUALIZA en vez de crear.
   *
   * Es el mismo formulario porque es la misma decisión —tipo, quién, cuándo,
   * dónde— y dos copias habrían divergido en la primera corrección. Editar es
   * lo que hace posible mover una sesión porque el alumno no puede ese martes,
   * que era el motivo de materializar las sesiones de un plan.
   */
  editing?: Session
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Con qué arranca el tronco: vacío, con la rutina traída, o con la sesión que se edita. */
function initialValue(editing: Session | undefined, preselectedRoutineId: string | undefined): SessionScheduleValue {
  return {
    // Con una rutina preseleccionada -desde «Usar en una sesion»- la
    // modalidad es fuerza sin preguntar: se viene de una rutina de sala.
    modality: editing?.modality ?? 'strength',
    routineId: editing?.routineId ?? preselectedRoutineId ?? NO_ROUTINE,
    date: editing === undefined ? undefined : parseLocalDateKey(editing.date),
    time: editing?.time ?? '',
    duration: String(editing?.durationMinutes ?? 60),
    location: editing?.location ?? '',
    notes: editing?.notes ?? '',
  }
}

/**
 * `open`/`onOpenChange` son opcionales: el diálogo se gobierna solo cuando nadie
 * se lo pide, y lo cede cuando la página necesita abrirlo —al llegar con una
 * rutina en la URL—. Obligar siempre al control externo habría hecho que la
 * página cargara con estado que no le importa.
 */
export function CreateSessionModal({
  preselectedRoutineId,
  editing,
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
   * Al editar, todo arranca de la sesion. El tipo se recupera por su etiqueta
   * porque la sesion guarda la categoria como TEXTO -en el idioma en que se
   * creo-; si no casa con ninguna, queda «personal», que es lo que era casi
   * siempre.
   */
  const [sessionType, setSessionType] = useState(
    editing === undefined ? '' : sessionTypeOf(editing, t)
  )
  const [studentId, setStudentId] = useState(editing?.studentId ?? '')
  const [value, setValue] = useState<SessionScheduleValue>(() =>
    initialValue(editing, preselectedRoutineId)
  )
  const [missing, setMissing] = useState<FieldName[]>([])
  /** Con qué choca, o `null` si no choca o ya se decidió agendar igual. */
  const [conflict, setConflict] = useState<string | null>(null)
  /** Lo que ya hay ese día, para marcar los tramos ocupados. */
  const [sessionsOfDay, setSessionsOfDay] = useState<Session[]>([])

  // Sólo el día elegido, no la agenda entera: ver `SessionRepository.findByDate`.
  useEffect(() => {
    if (value.date === undefined) {
      setSessionsOfDay([])
      return
    }

    let active = true
    container.sessions.findByDate(toLocalDateKey(value.date)).then((result) => {
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

  const isGroupSession = sessionType === 'group'

  const resetForm = () => {
    setConflict(null)
    setSessionType('')
    setStudentId('')
    setValue(initialValue(undefined, undefined))
    setMissing([])
  }

  const handleSubmit = () => {
    const faltan: FieldName[] = []
    if (!sessionType) faltan.push('sessionType')
    if (!isGroupSession && !studentId) faltan.push('student')
    if (value.date === undefined) faltan.push('date')
    if (value.time === '') faltan.push('time')
    if (value.location === '') faltan.push('location')

    setMissing(faltan)

    if (faltan.length > 0 || value.date === undefined) {
      toast.error(
        plural('newSession.missingOne', 'newSession.missingMany', faltan.length, {
          count: faltan.length,
        })
      )
      return
    }

    const dateKey = toLocalDateKey(value.date)

    /*
     * Se relee del puerto en vez de usar `sessionsOfDay`: entre elegir la hora y
     * pulsar puede haberse agendado algo, y la lista se cargo con la duracion de
     * entonces. Esta es la comprobacion que vale.
     */
    void container.sessions.findByDate(dateKey).then((sameDay) => {
      // Al editar, la sesion no choca consigo misma.
      const others = sameDay.filter((candidate) => candidate.id !== editing?.id)
      const choques = findOverlappingSessions(others, {
        date: dateKey,
        time: value.time,
        durationMinutes: Number(value.duration),
      })

      if (choques.length > 0) {
        setConflict(describeOverlap(choques))
        return
      }

      void scheduleSession()
    })
  }

  /**
   * El alta, ya sin comprobaciones: la decisión está tomada.
   *
   * SE ESPERA AL PUERTO antes de avisar y cerrar. Antes el aviso salia y el
   * dialogo se cerraba mientras la escritura viajaba, y si la base la
   * rechazaba la sesion «agendada» no existia. Si falla, el dialogo se queda
   * abierto con lo escrito y lo dice.
   */
  const scheduleSession = async () => {
    if (value.date === undefined) return

    const student = students.find((candidate) => candidate.id === studentId)
    const quien = isGroupSession
      ? t('newSession.theGroupClass')
      : getShortName(student?.firstName, student?.lastName)

    const routine = routines.find((candidate) => candidate.id === value.routineId)
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

    const data = {
      // El titulo lo pone la rutina cuando la hay: es lo que se lee en la
      // agenda, y «Full body · Principiante» dice mas que «Entrenamiento
      // personal». NO lleva el nombre del alumno dentro: eso se resuelve desde
      // `studentId`, y meterlo aqui seria una copia que envejece.
      title: routine?.title ?? t(category),
      studentId: isGroupSession ? null : studentId,
      kind: isGroupSession ? 'group' : 'individual',
      modality: value.modality,
      category: t(category),
      date: toLocalDateKey(value.date),
      time: value.time,
      durationMinutes: Number(value.duration),
      location: value.location,
      notes: value.notes,
      // Una sesion de cardio no ejecuta una rutina de sala.
      routineId:
        value.modality === 'cardio' || value.routineId === NO_ROUTINE ? null : value.routineId,
    } as const

    if (editing !== undefined) {
      /*
       * Estado y resultado se CONSERVAN: editar mueve la sesion, no la
       * reinicia. Una completada con su resultado sigue completada aunque se
       * le corrija el lugar.
       */
      try {
        await container.sessions.update(editing.id, {
          ...data,
          status: editing.status,
          result: editing.result,
        })
      } catch (caught) {
        toast.error(describeError(caught, t, 'newSession.error'))
        return
      }
      toast.success(t('newSession.updated'))
      setIsOpen(false)
      return
    }

    try {
      await container.sessions.create({
        ...data,
        // Recien creada esta pendiente, no confirmada: confirmarla es un acto
        // aparte y fingirlo aqui vaciaria de sentido el estado.
        status: 'pending',
        // Nace sin resultado: no ha ocurrido todavia.
        result: null,
      })
    } catch (caught) {
      toast.error(describeError(caught, t, 'newSession.error'))
      return
    }

    toast.success(
      t('newSession.scheduled', {
        who: quien,
        date: value.date.toLocaleDateString(activeLocale()),
        time: value.time,
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
      {/* Sin disparador al editar: se abre desde la ficha de la sesion, y un
          segundo boton «Nueva sesion» en la cabecera seria mentira. */}
      {editing === undefined && (
        <DialogTrigger asChild>
          <Button className="h-11 gap-2 sm:h-9">
            <Plus className="size-4" />
            {t('newSession.open')}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {editing === undefined ? t('newSession.title') : t('newSession.editTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/50">
            {editing === undefined ? t('newSession.hint') : t('newSession.editHint')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-5 pb-5">
          <fieldset className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <legend className={FIELD_LABEL}>{t('newSession.type')}</legend>
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
                <Label htmlFor="new-session-student" className={FIELD_LABEL}>
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

          <SessionScheduleFields
            idPrefix="new-session"
            value={value}
            onChange={handleChange}
            routines={routines}
            sessionsOfDay={sessionsOfDay}
            missing={missing.filter(isSharedField)}
            notesPlaceholder={t('newSession.notesPlaceholder')}
            notesOptionalHint
          />

          {conflict !== null && (
            <ScheduleConflictNotice message={conflict} onOverride={scheduleSession} />
          )}

          <Button
            onClick={handleSubmit}
            className="h-14 w-full gap-2 font-display text-base font-extrabold uppercase tracking-[0.14em]"
          >
            <CalendarCheck className="size-5" />
            {editing === undefined ? t('newSession.submit') : t('newSession.saveChanges')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function isSharedField(field: FieldName): field is SessionFieldName {
  return field === 'date' || field === 'time' || field === 'location'
}
