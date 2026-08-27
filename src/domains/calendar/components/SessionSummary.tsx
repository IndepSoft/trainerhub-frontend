import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { SESSION_STATUS } from '../libs/sessionStatus'
import type { SessionStatus } from '../types/calendar.types'

/**
 * Resumen de sesiones por estado.
 *
 * Eran tres bloques Card practicamente identicos, copiados y pegados, con el
 * icono, el color y el texto cambiados a mano en cada uno. Ahora es una tabla
 * mas un map: añadir un estado no toca el JSX.
 */
const SUMMARY_ITEMS: {
  status: SessionStatus
  heading: string
  description: string
  iconClassName: string
  countClassName: string
}[] = [
  {
    status: 'confirmed',
    heading: 'Confirmadas',
    description: 'Sesiones confirmadas',
    iconClassName: 'w-5 h-5 text-green-500',
    countClassName: 'text-2xl font-bold text-green-600',
  },
  {
    status: 'pending',
    heading: 'Pendientes',
    description: 'Esperando confirmación',
    iconClassName: 'w-5 h-5 text-yellow-500',
    countClassName: 'text-2xl font-bold text-yellow-600',
  },
  {
    status: 'cancelled',
    heading: 'Canceladas',
    description: 'Sesiones canceladas',
    iconClassName: 'w-5 h-5 text-red-500',
    countClassName: 'text-2xl font-bold text-red-600',
  },
]

interface SessionSummaryProps {
  countByStatus: Record<SessionStatus, number>
}

export function SessionSummary({ countByStatus }: SessionSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {SUMMARY_ITEMS.map((item) => (
        <Card key={item.status}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className={item.iconClassName}>
                {SESSION_STATUS[item.status].icon}
              </span>
              {item.heading}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={item.countClassName}>
              {countByStatus[item.status]}
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
