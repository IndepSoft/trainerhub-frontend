import { cn } from '@/shared/lib/utils'
import type { Session, SessionStatus } from '../types/dashboard.types'

/**
 * Etiqueta y color de cada estado.
 *
 * El estado es un dato, no una accion, asi que no usa la marca: va a la escala
 * semantica. Si «Programada» usara Cobalt se leeria como un boton primario.
 */
const STATUS_BADGE: Record<SessionStatus, { label: string; className: string }> = {
  programmed: { label: 'Programada', className: 'border-cobalt/30 text-cobalt' },
  confirmed: { label: 'Confirmada', className: 'border-scale-3/40 text-scale-3' },
  canceled: { label: 'Cancelada', className: 'border-destructive/40 text-destructive' },
}

interface SessionItemProps {
  session: Session
}

export function SessionItem({ session }: SessionItemProps) {
  const badge = STATUS_BADGE[session.status]

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{session.customer}</p>
        <p className="truncate text-sm text-ink/50">{session.activity}</p>
      </div>

      {/* Insignia de contorno, no de relleno: en el registro sobrio un bloque
          de color solido para un estado compite con la cifra protagonista. */}
      <span
        className={cn(
          'shrink-0 rounded-action border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
          badge.className
        )}
      >
        {badge.label}
      </span>
    </div>
  )
}
