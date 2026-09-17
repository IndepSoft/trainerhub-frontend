import { useState } from 'react'
import { ListRow } from '@/shared/components/ListRow'
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
 * QUÉ SE LLEVA POR DELANTE se dice DENTRO (§49), no en la fila: es lo que hay
 * que leer para decidir, y en la fila era un párrafo de tres líneas bajo un
 * rótulo de tres palabras.
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
    <>
      <ListRow
        primary={t('settings.deleteAccount')}
        onSelect={() => setConfirming(true)}
        className="[&_span]:text-danger"
      />

      {error !== null && (
        <li className="py-3">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </li>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.deleteAccount.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('settings.deleteAccount.hint')}</DialogDescription>
          </DialogHeader>

          <p className="text-sm text-ink/70">{t('settings.deleteAccount.confirmBody')}</p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? t('settings.deleteAccount.deleting') : t('settings.deleteAccount.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
