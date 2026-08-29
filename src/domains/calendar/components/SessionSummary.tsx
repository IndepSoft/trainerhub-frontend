import { SESSION_STATUS } from '../libs/sessionStatus'
import type { SessionStatus } from '../types/calendar.types'

/**
 * Resumen de sesiones por estado.
 *
 * Tres bloques separados por reglas de 1 px, no tres tarjetas: es el mismo
 * patrón que los indicadores del dashboard y de reportes, y el que hace que las
 * cifras de las tres caigan en la misma línea y se comparen de un vistazo.
 */
const SUMMARY_ITEMS: {
  status: SessionStatus
  heading: string
  className: string
}[] = [
  { status: 'confirmed', heading: 'Confirmadas', className: 'text-success' },
  { status: 'pending', heading: 'Pendientes', className: 'text-warning' },
  { status: 'cancelled', heading: 'Canceladas', className: 'text-danger' },
]

interface SessionSummaryProps {
  countByStatus: Record<SessionStatus, number>
}

export function SessionSummary({ countByStatus }: SessionSummaryProps) {
  return (
    <div className="grid grid-cols-3 divide-x divide-cobalt-tint-3 border-y border-cobalt-tint-3">
      {SUMMARY_ITEMS.map((item) => (
        <div key={item.status} className="flex flex-col gap-2 px-4 py-5 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/50 sm:text-[11px]">
              {item.heading}
            </span>
            <span className={item.className}>{SESSION_STATUS[item.status].icon}</span>
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
