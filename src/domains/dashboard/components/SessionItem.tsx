import { Badge } from '@/shared/ui/badge'
import type { Session, SessionStatus } from '../types/dashboard.types'

/**
 * Etiqueta y color de cada estado.
 *
 * Antes eran tres condicionales encadenados en el JSX. Como tabla, añadir un
 * estado es una línea y el compilador obliga a rellenarla: `Record` sobre la
 * unión no admite que falte ninguna clave.
 */
const STATUS_BADGE: Record<SessionStatus, { label: string; className: string }> = {
  programmed: { label: 'Programada', className: 'bg-primary' },
  confirmed: { label: 'Confirmada', className: 'bg-green-500' },
  canceled: { label: 'Cancelada', className: 'bg-red-500' },
}

interface SessionItemProps {
  session: Session
}

export function SessionItem({ session }: SessionItemProps) {
  const badge = STATUS_BADGE[session.status]

  return (
    <div className="flex items-center">
      <div className="flex-1">
        <span className="font-semibold text-md">{session.customer}</span>
        <p className="text-muted-foreground">
          {session.scheduledDate} - {session.activity}
        </p>
      </div>
      <div>
        <Badge className={badge.className}>{badge.label}</Badge>
      </div>
    </div>
  )
}
