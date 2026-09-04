import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { Label } from '@/shared/ui/label'
import { ArrowUpRight, Clock, MapPin, MessageSquare, Pencil, Play, Trash2, User } from 'lucide-react'
import { useSchedulableRoutines } from '../hooks/useSchedulableRoutines'
import { useSchedulableStudents } from '../hooks/useSchedulableStudents'
import { resolveSessionStudentName } from '../libs/sessionStudent'
import { activeLocale } from '@/shared/i18n/activeLocale'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { SESSION_STATUS, SESSION_STATUS_ENTRIES } from '../libs/sessionStatus'
import { getStudentInitials, parseLocalDateKey } from '../libs/calendar.utils'
import type { Session, SessionStatus } from '../types/calendar.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface SessionDetailsModalProps {
  session: Session
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (sessionId: string, newStatus: SessionStatus) => void
  onDelete: (sessionId: string) => void
}

/**
 * Detalle de una sesión.
 *
 * Reescrito alrededor de una idea: lo que se hace con una sesión programada es
 * EMPEZARLA. Antes las tres acciones eran «enviar recordatorio», «editar» y
 * «eliminar», las tres del mismo tamaño, y no había forma de iniciar nada.
 * Ahora «Iniciar sesión» es un botón ancho justo bajo la cabecera y el resto
 * baja a acciones secundarias.
 *
 * Fuera las tres `Card` anidadas dentro del diálogo. Un diálogo YA es un
 * contenedor; meterle tarjetas dentro es la tercera capa de caja para el mismo
 * contenido.
 */
export function SessionDetailsModal({
  session,
  open,
  onOpenChange,
  onStatusChange,
  onDelete,
}: SessionDetailsModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [newStatus, setNewStatus] = useState<SessionStatus>(session.status)
  const [sessionNotes, setSessionNotes] = useState(session.notes)

  /*
   * La rutina se resuelve por el puerto, igual que los alumnos. La sesion guarda
   * el identificador y no el nombre: si el entrenador corrige la rutina, esta
   * ficha lo refleja sin tener que tocar la sesion.
   */
  const { routines } = useSchedulableRoutines()

  /*
   * El nombre se resuelve desde `studentId`, con la misma funcion que usan la
   * tarjeta y la celda semanal: si las tres lo compusieran por su cuenta, se
   * separarian en cuanto cambiara el caso del alumno borrado.
   */
  const { students } = useSchedulableStudents()
  const studentName = resolveSessionStudentName(
    session,
    new Map(students.map((student) => [student.id, student])),
    t
  )
  const routine = routines.find((candidate) => candidate.id === session.routineId)

  const status = SESSION_STATUS[session.status]

  /**
   * Una sesión cancelada no se puede empezar. Se deshabilita en vez de
   * ocultarse: que el botón desaparezca deja al usuario buscando qué ha pasado.
   */
  const canStart = session.status !== 'cancelled'

  const handleStart = () => {
    onOpenChange(false)
    navigate(`/session/${session.id}`)
  }

  const handleStatusUpdate = () => {
    if (newStatus === session.status) return

    onStatusChange(session.id, newStatus)
    toast.success(
      t('sessionDetails.markedAs', {
        status: t(SESSION_STATUS[newStatus].labelKey).toLowerCase(),
      })
    )

    /*
     * Se cierra al guardar. `session` es una instantanea tomada al abrir, asi
     * que dejar el dialogo abierto lo dejaria mostrando el estado ANTERIOR al
     * cambio que se acaba de confirmar: la insignia diria «confirmada» sobre una
     * sesion que ya esta completada.
     */
    onOpenChange(false)
  }

  const handleDelete = () => {
    // Borra de verdad. Antes solo decia que lo habia hecho.
    onDelete(session.id)
    toast.success(t('sessionDetails.deleted'))
    onOpenChange(false)
  }

  const handleSendReminder = () => {
    toast.success(t('sessionDetails.reminderSent', { student: studentName }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        <DialogHeader className="space-y-0 px-5 pt-5 text-left">
          <div className="flex items-start gap-3">
            {/* Sin AvatarImage: apuntaba a /generic-placeholder-icon.png, que no
                existe y devolvía 404 en cada apertura. El mismo defecto se
                corrigió ya en DayView y aquí había sobrevivido. */}
            <Avatar className="size-11 shrink-0">
              <AvatarFallback className="bg-cobalt-tint-2 font-semibold text-cobalt">
                {getStudentInitials(studentName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
                {session.title}
              </DialogTitle>
              <p className="mt-1.5 text-sm text-ink/50">{session.category}</p>
            </div>

            <span
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-action px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider',
                status.badgeClassName
              )}
            >
              {status.icon}
              {t(status.labelKey)}
            </span>
          </div>
        </DialogHeader>

        <div className="px-5">
          {/* La acción principal, ancha y arriba: es lo que se viene a hacer. */}
          <Button
            onClick={handleStart}
            disabled={!canStart}
            className="h-14 w-full gap-2 font-display text-base font-extrabold uppercase tracking-[0.14em]"
          >
            <Play className="size-5" />
            {t('sessionDetails.start')}
          </Button>

          {!canStart && (
            <p className="mt-2 text-center text-xs text-ink/45">
              {t('sessionDetails.cannotStart')}
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 divide-x divide-cobalt-tint-3 border-y border-cobalt-tint-3">
          <div className="px-5 py-4">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
              {t('sessionDetails.when')}
            </dt>
            <dd className="metric-figures mt-1 text-sm font-semibold text-ink">
              {session.time}
              <span className="ml-1.5 font-normal text-ink/50">
                {session.durationMinutes} min
              </span>
            </dd>
            <dd className="mt-0.5 text-xs text-ink/45">
              {parseLocalDateKey(session.date).toLocaleDateString(activeLocale(), {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </dd>
          </div>

          <div className="px-5 py-4">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
              {t('sessionDetails.whereWho')}
            </dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <MapPin className="size-3.5 shrink-0 text-cobalt" />
              <span className="truncate">{session.location}</span>
            </dd>
            <dd className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/45">
              <User className="size-3 shrink-0" />
              <span className="truncate">{studentName}</span>
            </dd>
          </div>
        </dl>

        <div className="space-y-5 px-5 pb-5">
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
              {t('sessionDetails.status')}
            </Label>
            <div className="flex gap-2">
              <Select
                value={newStatus}
                onValueChange={(value: SessionStatus) => setNewStatus(value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Las opciones salen de la tabla de estados: antes las
                      etiquetas estaban escritas aquí y también en getStatusText,
                      y podían divergir. */}
                  {SESSION_STATUS_ENTRIES.map(([value, presentation]) => (
                    <SelectItem key={value} value={value}>
                      {t(presentation.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleStatusUpdate}
                disabled={newStatus === session.status}
              >
                {t('common.save')}
              </Button>
            </div>
          </div>

          {routine !== undefined && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                {t('newSession.routine')}
              </span>
              <Link
                to={`/trainings/${routine.id}`}
                className="flex min-h-11 items-center justify-between gap-3 rounded-block border border-cobalt-tint-3 px-4 text-sm text-ink transition-colors hover:border-cobalt/40 hover:text-cobalt"
              >
                {routine.title}
                <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-ink/30" />
              </Link>
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="session-notes"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60"
            >
              {t('newSession.notes')}
            </Label>
            <Textarea
              id="session-notes"
              value={sessionNotes}
              onChange={(event) => setSessionNotes(event.target.value)}
              placeholder={t('sessionDetails.notesPlaceholder')}
              rows={3}
            />
          </div>

          {/* Secundarias, y la destructiva separada por una regla: en la versión
              anterior «Eliminar» tenía el mismo peso que «Editar». */}
          <div className="flex flex-wrap gap-2 border-t border-cobalt-tint-3 pt-4">
            <Button variant="outline" onClick={handleSendReminder} className="gap-2">
              <MessageSquare className="size-4" />
              {t('sessionDetails.reminder')}
            </Button>
            <Button variant="outline" className="gap-2">
              <Pencil className="size-4" />
              {t('common.edit')}
            </Button>
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="ms-auto gap-2 text-danger hover:bg-danger-surface hover:text-danger"
            >
              <Trash2 className="size-4" />
              {t('common.delete')}
            </Button>
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-ink/35">
            <Clock className="size-3" />
            {/* TODO: ni el estado ni las notas se persisten: el cambio vive sólo
                en memoria hasta que exista el repositorio. */}
            {t('sessionDetails.notSaved')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
