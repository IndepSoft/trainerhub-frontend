import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { renewedThrough } from '@/shared/domain/subscriptionRules'
import { SUBSCRIPTION_PERIOD_LABEL_KEY } from '@/shared/i18n/domainLabels'
import type { StudentSubscription } from '@/shared/domain/entities/studentSubscription'
import { todayKey } from '@/shared/lib/dateKey'
import { formatDateKey } from '../libs/dateKey'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface DuesPaymentDialogProps {
  open: boolean
  /** El nombre corto del alumno, para decir de quién es el pago. */
  studentName: string
  /** La cuota tal y como está: de ahí salen el periodo y la fecha cubierta. */
  subscription: StudentSubscription
  busy: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  /** Registra el pago con la fecha en que se hizo. */
  onConfirm: (paidOn: string) => void
}

/**
 * Registrar un pago, con su fecha y lo que cubre.
 *
 * ERA UN BOTÓN QUE ESCRIBÍA AL PULSARLO. Cobrar mueve una fecha y no se puede
 * deshacer desde la aplicación, así que ahora se ve ANTES qué se va a escribir:
 * hasta cuándo queda cubierta la cuota con ese pago.
 *
 * Y LA FECHA SE PUEDE CAMBIAR, que es el caso corriente: el dinero se recibe el
 * lunes y se registra el miércoles. La regla es la misma —`renewedThrough`, que
 * cuenta desde la fecha pagada o desde el día del pago, lo que sea posterior—;
 * aquí sólo se le dice desde cuándo.
 *
 * El periodo NO se toca aquí: se elige en la sección, que es donde vive esa
 * decisión, y tenerlo en dos sitios sería dos controles para un mismo dato.
 */
export function DuesPaymentDialog({
  open,
  studentName,
  subscription,
  busy,
  error,
  onOpenChange,
  onConfirm,
}: DuesPaymentDialogProps) {
  const { t } = useTranslation()
  const today = todayKey()
  const [paidOn, setPaidOn] = useState(today)

  const coversUntil = renewedThrough(subscription, paidOn)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        // Al cerrar vuelve a hoy: la próxima vez es otro pago.
        if (!next) setPaidOn(today)
      }}
    >
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {t('dues.registerPayment')}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/60">
            {t('dues.paymentHint', { name: studentName })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Label
              htmlFor="cuota-pagado-el"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60"
            >
              {t('dues.paidOn')}
            </Label>
            {/* Sin fechas futuras: un pago que todavía no se ha recibido no se
                registra. */}
            <Input
              id="cuota-pagado-el"
              type="date"
              max={today}
              className="mt-1.5"
              value={paidOn}
              onChange={(event) => setPaidOn(event.target.value)}
            />
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
              {t('dues.coversUntil')}
            </span>
            {/* Derivado, no un campo: lo decide el periodo, y escribirlo a mano
                sería poder contradecirlo. */}
            <p className="mt-1.5 flex min-h-11 items-center text-sm font-semibold text-ink">
              {formatDateKey(coversUntil)}
            </p>
          </div>
        </div>

        <p className="text-[13px] text-ink/60">
          {t('dues.paymentPeriod', {
            period: t(SUBSCRIPTION_PERIOD_LABEL_KEY[subscription.periodDays]),
          })}
        </p>

        {error !== null && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            className="gap-2"
            disabled={busy}
            onClick={() => onConfirm(paidOn)}
          >
            <CreditCard className="size-4" />
            {t('dues.registerPayment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
