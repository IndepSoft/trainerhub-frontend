import { useState } from 'react'
import { BellRing, Check, CreditCard } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { SubscriptionBadge } from '@/shared/components/SubscriptionBadge'
import { cn } from '@/shared/lib/utils'
import { container } from '@/app/container'
import { useViewerContext } from '@/app/ViewerContext'
import { describeError } from '@/shared/i18n/errorMessages'
import {
  SUBSCRIPTION_PERIOD_DAYS,
  type SubscriptionStanding,
} from '@/shared/domain/entities/studentSubscription'
import { SUBSCRIPTION_PERIOD_LABEL_KEY } from '@/shared/i18n/domainLabels'
import { formatDateKey } from '../libs/dateKey'
import { duesReminderDraft } from '../libs/duesReminder'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { NoticeDialog } from './NoticeDialog'
import type { NoticeKind } from '@/shared/domain/entities/notice'
import type { Student } from '@/shared/domain/entities/student'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface StudentSubscriptionSectionProps {
  student: Student
}

/**
 * El borde de la tarjeta de estado, del mismo color que su insignia. Sólo las
 * dos que reclaman algo lo llevan de color; al día y sin cuota, la regla del
 * sistema, para que lo urgente siga destacando.
 */
const STANDING_CARD: Record<SubscriptionStanding['state'], string> = {
  overdue: 'border-danger',
  dueSoon: 'border-ember',
  active: 'border-cobalt-tint-3',
  never: 'border-cobalt-tint-3',
}

/**
 * La cuota de un alumno, en su ficha.
 *
 * AQUÍ ES DONDE SE PREGUNTA. «¿Hasta cuándo tiene pagado?» se responde mirando a
 * la persona, no abriendo un módulo de facturación: quien lo consulta ya está en
 * su ficha porque está hablando con ella o va a agendarle algo.
 *
 * PRIMERO EL ESTADO, DESPUÉS LO QUE SE PUEDE HACER. La tarjeta dice en qué
 * punto está y hasta cuándo; debajo, cobrar y avisar, que son las dos cosas que
 * se vienen a hacer; y al final la periodicidad, que se toca una vez.
 *
 * Y AQUÍ SE AVISA, por lo mismo. El recordatorio sale con el texto escrito según
 * el estado —no es igual avisar de lo que va a pasar que reclamar lo que ya
 * pasó— y se puede reescribir antes de mandarlo.
 *
 * Cobrar y cambiar el periodo son DOS ACCIONES DISTINTAS y se separan: renovar
 * mueve la fecha, cambiar el periodo sólo dice cada cuánto se cobrará a partir
 * de ahora. Mezclarlas dejaría cobrar tres meses creyendo cambiar la tarifa.
 */
export function StudentSubscriptionSection({ student }: StudentSubscriptionSectionProps) {
  const { t } = useTranslation()
  const { can } = useViewerContext()
  const { byStudent, standingOf, renew, setPeriod, loading } = useSubscriptions()

  const [noticeOpen, setNoticeOpen] = useState(false)
  const [justRenewed, setJustRenewed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return null

  const subscription = byStudent.get(student.id)
  const standing = standingOf(student.id)
  const canManage = can('students.manage')
  const paidThrough = subscription?.paidThrough ?? null
  const periodKey =
    subscription === undefined ? undefined : SUBSCRIPTION_PERIOD_LABEL_KEY[subscription.periodDays]
  /*
   * Sin cuenta no hay campana TODAVIA: el aviso se guarda con la ficha y lo
   * lee cuando se registre con ese correo. Se dice, en vez de dar por leido lo
   * que todavia no tiene donde llegar. Con la vía A como alta corriente es el
   * caso normal, no el raro.
   */
  const hasAccount = student.profileId !== null

  const handleSend = async (body: string, kind: NoticeKind) => {
    await container.notices.send({ studentId: student.id, kind, body })
  }

  // Cobrar y cambiar el periodo se esperan y se dicen: eran promesas sueltas.
  const handleRenew = async () => {
    setError(null)
    try {
      await renew(student.id, student.crewId)
    } catch (caught) {
      setError(describeError(caught, t, 'dues.error'))
      return
    }
    // Confirmación breve y en el sitio: cobrar mueve una fecha, y sin acuse el
    // botón parece no haber hecho nada.
    setJustRenewed(true)
    window.setTimeout(() => setJustRenewed(false), 2500)
  }

  const handleSetPeriod = async (days: number) => {
    setError(null)
    try {
      await setPeriod(student.id, student.crewId, days)
    } catch (caught) {
      setError(describeError(caught, t, 'dues.error'))
    }
  }

  return (
    <div className="flex flex-col gap-4 px-5 pb-8 pt-2">
      <section
        aria-label={t('dues.title')}
        className={cn(
          'flex flex-col gap-1.5 rounded-block border bg-surface px-4 py-3.5',
          STANDING_CARD[standing.state]
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <SubscriptionBadge standing={standing} />
          {periodKey !== undefined && (
            <span className="text-xs text-ink/60">{t(periodKey)}</span>
          )}
        </div>

        {/* La fecha exacta, grande: la insignia dice si corre prisa, esto dice
            qué día es. Las dos cosas se necesitan. */}
        <p className="font-display text-[1.375rem] font-extrabold uppercase leading-tight text-ink">
          {paidThrough === null
            ? t('dues.none')
            : t('reports.paidThrough', { date: formatDateKey(paidThrough) })}
        </p>

        {!hasAccount && <p className="text-[13px] text-ink/60">{t('notice.noAccount')}</p>}
      </section>

      {canManage && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-w-[9.5rem] flex-1 gap-2 rounded-action"
              onClick={() => void handleRenew()}
            >
              {justRenewed ? <Check className="size-4" /> : <CreditCard className="size-4" />}
              {justRenewed ? t('dues.renewed') : t('dues.registerPayment')}
            </Button>

            <Button
              variant="outline"
              className="min-w-[9.5rem] flex-1 gap-2 rounded-action"
              onClick={() => setNoticeOpen(true)}
            >
              <BellRing className="size-4" />
              {t('reports.notify')}
            </Button>
          </div>

          {error !== null && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <section role="group" aria-label={t('dues.period')} className="mt-2 flex flex-col gap-2.5">
            <h2 className="border-b border-cobalt-tint-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
              {t('dues.period')}
            </h2>

            <div className="flex flex-wrap gap-1.5">
              {SUBSCRIPTION_PERIOD_DAYS.map((days) => {
                const isSelected = subscription?.periodDays === days

                return (
                  <button
                    key={days}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => void handleSetPeriod(days)}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-action border px-3.5 text-[13px] font-medium transition-colors',
                      isSelected
                        ? 'border-cobalt bg-cobalt text-white'
                        : 'border-cobalt-tint-3 bg-surface text-ink hover:border-cobalt/40'
                    )}
                  >
                    {t(SUBSCRIPTION_PERIOD_LABEL_KEY[days])}
                  </button>
                )
              })}
            </div>

            {/* El porqué de que esto exista: lo normal es mensual, pero no
                siempre, y sin esto habría que falsear la fecha para cuadrar un
                bono trimestral. */}
            <p className="text-[13px] text-ink/45">{t('dues.periodHint')}</p>
          </section>
        </>
      )}

      <NoticeDialog
        open={noticeOpen}
        studentFirstName={student.firstName}
        draft={duesReminderDraft(student.firstName, standing, t)}
        kind="dues"
        onOpenChange={setNoticeOpen}
        onSend={handleSend}
      />
    </div>
  )
}
