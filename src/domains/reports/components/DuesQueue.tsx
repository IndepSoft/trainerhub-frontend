import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { SubscriptionBadge } from '@/shared/components/SubscriptionBadge'
import { getShortName } from '@/shared/lib/personName'
import { container } from '@/app/container'
import { useViewerContext } from '@/app/ViewerContext'
import { formatDateKey } from '@/domains/students/libs/dateKey'
import { duesReminderDraft } from '@/domains/students/libs/duesReminder'
import { NoticeDialog } from '@/domains/students/components/NoticeDialog'
import { useDuesQueue, type DuesEntry } from '../hooks/useDuesQueue'
import type { NoticeKind } from '@/shared/domain/entities/notice'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * La cola de cobros. Solo composicion.
 *
 * SE LEE DE ARRIBA ABAJO Y SE LLAMA. Lo vencido primero -es dinero que ya se
 * debia- y dentro de cada grupo, lo que vence antes. Una lista de cuotas por
 * orden alfabetico obligaria a recorrerla entera para encontrar lo urgente.
 *
 * Se avisa DESDE AQUI, sin abrir la ficha: quien esta pasando la cola manda
 * cinco recordatorios seguidos, y obligarle a entrar y salir de cinco fichas es
 * lo que hace que deje de pasarla.
 */
export function DuesQueue() {
  const { t } = useTranslation()
  const { queue, loading } = useDuesQueue()
  const { can } = useViewerContext()
  const [reminding, setReminding] = useState<DuesEntry | null>(null)

  const canManage = can('students.manage')

  if (loading) return null

  if (queue.length === 0) {
    return <p className="py-8 text-sm text-ink/45">{t('reports.noStudents')}</p>
  }

  return (
    <>
      <ul className="divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
        {queue.map((entry) => (
          <li
            key={entry.student.id}
            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">
                <Link
                  to={`/students/${entry.student.id}`}
                  className="outline-none hover:text-cobalt focus-visible:underline"
                >
                  {getShortName(entry.student.firstName, entry.student.lastName)}
                </Link>
              </p>
              {entry.paidThrough !== null && (
                <p className="truncate text-xs text-ink/45">
                  {t('reports.paidThrough', { date: formatDateKey(entry.paidThrough) })}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <SubscriptionBadge standing={entry.standing} />

              {canManage && (
                <Button
                  variant="outline"
                  className="ms-auto shrink-0 gap-2 sm:ms-0"
                  onClick={() => setReminding(entry)}
                >
                  <BellRing className="size-4" />
                  {t('reports.notify')}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <NoticeDialog
        open={reminding !== null}
        studentFirstName={reminding?.student.firstName ?? ''}
        draft={
          reminding === null
            ? ''
            : duesReminderDraft(reminding.student.firstName, reminding.standing, t)
        }
        kind="dues"
        onOpenChange={(open) => {
          if (!open) setReminding(null)
        }}
        onSend={async (body: string, kind: NoticeKind) => {
          if (reminding === null) return
          await container.notices.send({ studentId: reminding.student.id, kind, body })
        }}
      />
    </>
  )
}
