import { AlertCircle } from 'lucide-react'
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

interface ConfirmDeleteDialogProps {
  open: boolean
  /** Lo que se va a borrar, para nombrarlo en la pregunta. */
  name: string
  /** Qué es, en singular y en minúscula: «rutina», «plan». */
  kind: string
  /** Cuando el borrado no es posible, el motivo. Sustituye a la confirmación. */
  blockedReason?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * Confirmación de borrado. Sólo presentación.
 *
 * Vive en `shared` desde que un segundo dominio lo necesita —estudiantes, además
 * de entrenamientos—, que es el mismo criterio por el que subieron `Routine` y
 * `DeletionResult`: se comparte lo que dos dominios usan, no lo que parece
 * genérico.
 *
 * El diálogo hace de las dos cosas: pregunta cuando se puede borrar, y explica
 * cuando no. Sacar el bloqueo a un aviso aparte obligaría al usuario a pulsar
 * «Eliminar», ver cerrarse el diálogo y buscar por la página qué ha pasado.
 *
 * La acción destructiva NO es la primera ni la que recibe el foco: si alguien
 * pulsa Intro por inercia, no debe borrar nada.
 */
export function ConfirmDeleteDialog({
  open,
  name,
  kind,
  blockedReason,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation()
  const isBlocked = blockedReason !== undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {isBlocked ? t('confirmDelete.blockedTitle') : t('confirmDelete.title', { kind })}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/60">
            {isBlocked ? (
              <span className="flex items-start gap-2 text-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>
                  {t('confirmDelete.blockedBody', { name, reason: blockedReason })}
                </span>
              </span>
            ) : (
              <>{t('confirmDelete.body', { name })}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {isBlocked ? t('common.understood') : t('common.cancel')}
          </Button>
          {!isBlocked && (
            <Button type="button" variant="destructive" onClick={onConfirm}>
              {t('common.delete')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
