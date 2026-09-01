import { cn } from '@/shared/lib/utils'
import type { Session, SessionStatus } from '@/shared/domain/entities/session'

/**
 * Etiqueta y color de cada estado.
 *
 * El estado es un dato, no una accion, asi que no usa la marca: va a la escala
 * semantica. Si «Pendiente» usara Cobalt se leeria como un boton primario.
 *
 * Son los MISMOS cuatro que la agenda, porque ahora es la misma entidad. Antes
 * el panel tenia su propia escala -`programmed | confirmed | canceled`- que ni
 * siquiera coincidia con la de las sesiones de verdad.
 */
const STATUS_BADGE: Record<SessionStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'border-warning/40 text-warning' },
  confirmed: { label: 'Confirmada', className: 'border-success/40 text-success' },
  completed: { label: 'Completada', className: 'border-cobalt/40 text-cobalt' },
  cancelled: { label: 'Cancelada', className: 'border-danger/40 text-danger' },
}

interface SessionItemProps {
  session: Session
  /** El nombre del alumno, ya resuelto por quien compone. */
  studentName: string
}

export function SessionItem({ session, studentName }: SessionItemProps) {
  const badge = STATUS_BADGE[session.status]

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{studentName}</p>
        <p className="truncate text-sm text-ink/50">{session.title}</p>
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
