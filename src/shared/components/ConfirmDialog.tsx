import { Button } from '@/shared/ui/button'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  /** El texto del botón que confirma. */
  confirmLabel: string
  /** Rojo cuando lo que se confirma se puede lamentar; azul cuando no. */
  destructive?: boolean
  /** Apaga el botón mientras la escritura viaja. */
  busy?: boolean
  /** El fallo de la escritura, para decirlo aquí y no cerrar. */
  error?: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * Confirmación genérica de algo que no es un borrado: dar de baja, salir de un
 * equipo. `ConfirmDeleteDialog` sigue para lo que se borra, con su bloqueo;
 * esto pregunta y ejecuta.
 *
 * La acción NO recibe el foco: quien pulsa Intro por inercia cancela.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  destructive = false,
  busy = false,
  error = null,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/60">{body}</DialogDescription>
        </DialogHeader>

        {error !== null && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
