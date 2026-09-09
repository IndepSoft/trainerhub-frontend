import { useState } from 'react'
import { CalendarClock, CalendarX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'
import { useDumpedSessions } from '../hooks/useDumpedSessions'

interface DumpActionsProps {
  assignmentId: string
}

/**
 * Lo que se puede hacer con un volcado ya hecho: verlo, moverlo una semana o
 * cancelar lo que queda. Sólo aparece cuando hay sesiones que salieron de esta
 * asignación; un plan sin volcar no tiene nada que mover.
 *
 * Cancelar pide una segunda pulsación en el sitio, no un diálogo: es
 * reversible —cada sesión se puede volver a poner pendiente desde la agenda— y
 * un diálogo para algo reversible es fricción sin protección.
 */
export function DumpActions({ assignmentId }: DumpActionsProps) {
  const { t } = useTranslation()
  const { sessions, openCount, shiftOneWeek, cancelOpen } = useDumpedSessions(assignmentId)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  if (sessions.length === 0) return null

  // Se avisa de lo que OCURRIO: si el puerto falla, se dice el fallo y no el
  // numero que se esperaba mover.
  const handleShift = async () => {
    try {
      const moved = await shiftOneWeek()
      toast.success(t('assignments.shifted', { count: moved }))
    } catch (caught) {
      toast.error(describeError(caught, t, 'assignments.actionError'))
    }
  }

  const handleCancel = async () => {
    try {
      const cancelled = await cancelOpen()
      setConfirmingCancel(false)
      toast.success(t('assignments.cancelled', { count: cancelled }))
    } catch (caught) {
      toast.error(describeError(caught, t, 'assignments.actionError'))
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="metric-figures text-xs text-ink/45">
        {t('assignments.dumped', { count: sessions.length, open: openCount })}
      </span>

      {openCount > 0 && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void handleShift()}
          >
            <CalendarClock className="size-3.5" />
            {t('assignments.shiftWeek')}
          </Button>

          {confirmingCancel ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => void handleCancel()}
            >
              <CalendarX className="size-3.5" />
              {t('assignments.cancelConfirm', { count: openCount })}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-danger hover:text-danger"
              onClick={() => setConfirmingCancel(true)}
            >
              <CalendarX className="size-3.5" />
              {t('assignments.cancelOpen')}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
