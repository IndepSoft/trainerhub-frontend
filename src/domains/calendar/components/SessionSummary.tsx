import { MISSED_SESSION, SESSION_STATUS, type SessionPresentationState } from '../libs/sessionStatus'
import { formatCompactWeekRange } from '../libs/calendar.utils'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * Cada estado con su rótulo y su color.
 *
 * EN SINGULAR Y EN PLURAL, porque el rótulo ya no encabeza una columna: va
 * pegado a la cifra, y «1 Pendientes» no es español.
 */
const SUMMARY_ITEMS: {
  status: SessionPresentationState
  oneKey: TranslationKey
  otherKey: TranslationKey
  className: string
}[] = [
  {
    status: 'pending',
    oneKey: 'calendar.summary.pending.one',
    otherKey: 'calendar.summary.pending.other',
    className: 'text-warning',
  },
  {
    status: 'confirmed',
    oneKey: 'calendar.summary.confirmed.one',
    otherKey: 'calendar.summary.confirmed.other',
    className: 'text-success',
  },
  {
    status: 'completed',
    oneKey: 'calendar.summary.completed.one',
    otherKey: 'calendar.summary.completed.other',
    className: 'text-cobalt',
  },
  {
    status: 'cancelled',
    oneKey: 'calendar.summary.cancelled.one',
    otherKey: 'calendar.summary.cancelled.other',
    className: 'text-danger',
  },
  // Lo que no ocurrio, aparte: antes engordaba «pendientes» para siempre.
  {
    status: 'missed',
    oneKey: 'calendar.summary.missed.one',
    otherKey: 'calendar.summary.missed.other',
    className: 'text-ink/50',
  },
]

interface SessionSummaryProps {
  countByStatus: Record<SessionPresentationState, number>
  /** La semana que se está mirando, que es de la que habla el resumen. */
  weekDates: Date[]
}

/**
 * Cómo va la semana que se mira, en cinco píldoras.
 *
 * ERAN CINCO BLOQUES de 90 px con la cifra a 30 px, dos por fila en móvil: 270
 * px por debajo del día, más que el propio día en una agenda tranquila. Y
 * contaban TODAS las sesiones que existen, que es el historial entero del
 * equipo y sólo sabe crecer. Ahora dicen de qué semana hablan y caben en dos
 * líneas.
 *
 * Un estado sin sesiones NO SE PINTA: «0 canceladas» ocupa lo mismo que «3
 * confirmadas» y no informa de nada. Si no hay ninguna, no hay resumen.
 */
export function SessionSummary({ countByStatus, weekDates }: SessionSummaryProps) {
  const { t, plural } = useTranslation()

  const withSessions = SUMMARY_ITEMS.filter((item) => countByStatus[item.status] > 0)
  if (withSessions.length === 0) return null

  const today = toLocalDateKey(new Date())
  const isCurrentWeek =
    today >= toLocalDateKey(weekDates[0]) && today <= toLocalDateKey(weekDates[weekDates.length - 1])

  return (
    /*
     * El nombre de la región NO es el rótulo que se ve: el rótulo dice DE QUÉ
     * semana se habla y cambia al navegar, y un nombre que cambia deja de
     * servir para encontrar la región. El rótulo sigue siendo un encabezado.
     */
    <section className="mt-6 flex flex-col gap-2 px-5" aria-label={t('calendar.weekSummary')}>
      <h2 className="border-b border-cobalt-tint-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
        {isCurrentWeek ? t('calendar.thisWeek') : formatCompactWeekRange(weekDates)}
      </h2>

      <ul className="flex flex-wrap gap-1.5">
        {withSessions.map((item) => (
          <li
            key={item.status}
            className="inline-flex h-8 items-center gap-1.5 rounded-action border border-cobalt-tint-3 bg-surface px-3 text-[13px] text-ink/60"
          >
            <span className={item.className}>
              {(item.status === 'missed' ? MISSED_SESSION : SESSION_STATUS[item.status]).icon}
            </span>
            {plural(item.oneKey, item.otherKey, countByStatus[item.status], {
              count: countByStatus[item.status],
            })}
          </li>
        ))}
      </ul>
    </section>
  )
}
