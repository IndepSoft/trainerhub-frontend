import { MISSED_SESSION, SESSION_STATUS, type SessionPresentationState } from '../libs/sessionStatus'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * Resumen de sesiones por estado.
 *
 * Tres bloques separados por reglas de 1 px, no tres tarjetas: es el mismo
 * patrón que los indicadores del dashboard y de reportes, y el que hace que las
 * cifras de las tres caigan en la misma línea y se comparen de un vistazo.
 */
const SUMMARY_ITEMS: {
  status: SessionPresentationState
  headingKey: TranslationKey
  className: string
}[] = [
  { status: 'pending', headingKey: 'calendar.summary.pending', className: 'text-warning' },
  { status: 'confirmed', headingKey: 'calendar.summary.confirmed', className: 'text-success' },
  { status: 'completed', headingKey: 'calendar.summary.completed', className: 'text-cobalt' },
  { status: 'cancelled', headingKey: 'calendar.summary.cancelled', className: 'text-danger' },
  // Lo que no ocurrio, aparte: antes engordaba «pendientes» para siempre.
  { status: 'missed', headingKey: 'calendar.summary.missed', className: 'text-ink/50' },
]

interface SessionSummaryProps {
  countByStatus: Record<SessionPresentationState, number>
}

export function SessionSummary({ countByStatus }: SessionSummaryProps) {
  const { t } = useTranslation()
  return (
    /*
     * Dos por fila en movil y cuatro desde `sm`: cuatro columnas a 375 px dejan
     * 83 px por celda, donde «Completadas» no cabe. Las reglas interiores se
     * pintan con `divide-*` en escritorio y a mano en movil, porque `divide-x`
     * no sabe de filas.
     */
    <div className="grid grid-cols-2 border-t border-cobalt-tint-3 sm:grid-cols-5 [&>*]:border-b [&>*]:border-e [&>*]:border-cobalt-tint-3 [&>*:nth-child(2n)]:border-e-0 sm:[&>*:nth-child(2n)]:border-e sm:[&>*:last-child]:border-e-0">
      {SUMMARY_ITEMS.map((item) => (
        <div key={item.status} className="flex flex-col gap-2 px-4 py-5 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/50 sm:text-[11px]">
              {t(item.headingKey)}
            </span>
            <span className={item.className}>
              {(item.status === 'missed' ? MISSED_SESSION : SESSION_STATUS[item.status]).icon}
            </span>
          </div>

          <p
            className={`metric-figures font-display text-3xl font-extrabold leading-none ${item.className}`}
          >
            {countByStatus[item.status]}
          </p>
        </div>
      ))}
    </div>
  )
}
