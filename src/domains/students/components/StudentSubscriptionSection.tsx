import { useState } from 'react'
import { BellRing, Check } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { SubscriptionBadge } from '@/shared/components/SubscriptionBadge'
import { cn } from '@/shared/lib/utils'
import { container } from '@/app/container'
import { useViewerContext } from '@/app/ViewerContext'
import { SUBSCRIPTION_PERIODS } from '@/shared/domain/entities/studentSubscription'
import { formatDateKey } from '../libs/dateKey'
import { duesReminderDraft } from '../libs/duesReminder'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { NoticeDialog } from './NoticeDialog'
import type { NoticeKind } from '@/shared/domain/entities/notice'
import type { Student } from '@/shared/domain/entities/student'

interface StudentSubscriptionSectionProps {
  student: Student
}

/**
 * La cuota de un alumno, en su ficha.
 *
 * AQUÍ ES DONDE SE PREGUNTA. «¿Hasta cuándo tiene pagado?» se responde mirando a
 * la persona, no abriendo un módulo de facturación: quien lo consulta ya está en
 * su ficha porque está hablando con ella o va a agendarle algo.
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
  const { can } = useViewerContext()
  const { byStudent, standingOf, renew, setPeriod, loading } = useSubscriptions()

  const [noticeOpen, setNoticeOpen] = useState(false)
  const [justRenewed, setJustRenewed] = useState(false)

  if (loading) return null

  const subscription = byStudent.get(student.id)
  const standing = standingOf(student.id)
  const canManage = can('students.manage')

  const handleSend = async (body: string, kind: NoticeKind) => {
    await container.notices.send({ studentId: student.id, kind, body })
  }

  const handleRenew = async () => {
    await renew(student.id, student.crewId)
    // Confirmación breve y en el sitio: cobrar mueve una fecha, y sin acuse el
    // botón parece no haber hecho nada.
    setJustRenewed(true)
    window.setTimeout(() => setJustRenewed(false), 2500)
  }

  return (
    <section className="px-5 py-8" aria-labelledby="cuota-titulo">
      <h2
        id="cuota-titulo"
        className="mb-4 border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
      >
        Cuota
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        <SubscriptionBadge standing={standing} />

        {subscription?.paidThrough !== undefined && subscription.paidThrough !== null && (
          /* La fecha exacta al lado de los días: la insignia dice si corre
             prisa, esto dice qué día es. Las dos cosas se necesitan. */
          <span className="text-xs text-ink/45">
            Pagado hasta el {formatDateKey(subscription.paidThrough)}
          </span>
        )}
      </div>

      {canManage && (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button className="gap-2" onClick={() => void handleRenew()}>
              {justRenewed ? <Check className="size-4" /> : null}
              {justRenewed ? 'Cuota renovada' : 'Registrar pago'}
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => setNoticeOpen(true)}>
              <BellRing className="size-4" />
              Avisar
            </Button>
          </div>

          <div role="group" aria-label="Cada cuánto paga" className="mt-6">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
              Cada cuánto paga
            </span>
            <p className="mt-1 text-xs text-ink/45">
              {/* El porqué de que esto exista: lo normal es mensual, pero no
                  siempre, y sin esto habría que falsear la fecha para cuadrar
                  un bono trimestral. */}
              Cambiarlo no cobra nada: sólo dice cuánto durará el próximo pago.
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {SUBSCRIPTION_PERIODS.map((period) => {
                const isSelected = subscription?.periodDays === period.days

                return (
                  <button
                    key={period.days}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => void setPeriod(student.id, student.crewId, period.days)}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-action border px-3 text-xs font-semibold transition-colors',
                      isSelected
                        ? 'border-cobalt/50 bg-cobalt-tint text-cobalt'
                        : 'border-cobalt-tint-3 text-ink/50 hover:border-cobalt/40 hover:text-ink'
                    )}
                  >
                    {period.label}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      <NoticeDialog
        open={noticeOpen}
        studentFirstName={student.firstName}
        draft={duesReminderDraft(student.firstName, standing)}
        kind="dues"
        onOpenChange={setNoticeOpen}
        onSend={handleSend}
      />
    </section>
  )
}
