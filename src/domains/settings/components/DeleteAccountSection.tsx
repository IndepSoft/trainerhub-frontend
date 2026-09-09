import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useDeleteAccount } from '@/auth/hooks/useDeleteAccount'

/**
 * Darse de baja, con su confirmación.
 *
 * DOS PASOS Y NO UNO: es lo único de Configuración que no se puede deshacer,
 * y un botón rojo a la altura del pulgar en un móvil se pulsa sin querer. El
 * diálogo repite lo que va a pasar, con el botón de irse en segundo lugar.
 *
 * El error se pinta FUERA del diálogo: la negativa más probable es `lastAdmin`,
 * que pide hacer algo en otra pantalla, y hay que poder leerla con calma.
 */
export function DeleteAccountSection() {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const { loading, error, deleteAccount } = useDeleteAccount()

  const handleConfirm = async () => {
    await deleteAccount()
    setConfirming(false)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/45">{t('settings.deleteAccount.hint')}</p>

      {error !== null && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-danger/40 text-danger hover:bg-danger/5 hover:text-danger"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-4" />
        {t('settings.deleteAccount')}
      </Button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.deleteAccount.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('settings.deleteAccount.confirmBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirm} disabled={loading}>
              {loading ? t('settings.deleteAccount.deleting') : t('settings.deleteAccount.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
