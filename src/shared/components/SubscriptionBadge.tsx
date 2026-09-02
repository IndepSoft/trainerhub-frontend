import { cn } from '@/shared/lib/utils'
import { describeStanding } from '@/shared/domain/subscriptionRules'
import type { SubscriptionStanding } from '@/shared/domain/entities/studentSubscription'

/**
 * Cada estado con su color, y sólo dos llaman la atención.
 *
 * La cuota vencida va en rojo y la que vence pronto en Ember, que es el naranja
 * que este sistema reserva para lo que reclama acción. Al día va en gris: no
 * pide nada, y pintarla de verde haría que la pantalla entera pareciera un
 * semáforo donde lo urgente deja de destacar.
 */
const STANDING_BADGE: Record<SubscriptionStanding['state'], string> = {
  overdue: 'border-danger/40 bg-danger/5 text-danger',
  dueSoon: 'border-ember/40 bg-ember/10 text-ember-deep',
  active: 'border-cobalt-tint-3 text-ink/45',
  never: 'border-cobalt-tint-3 text-ink/40',
}

interface SubscriptionBadgeProps {
  standing: SubscriptionStanding
  className?: string
}

/**
 * En qué punto está la cuota de alguien, en una insignia.
 *
 * En `shared` porque la usan dos dominios: la ficha del alumno y la cola de
 * cobros de Reportes. Es el criterio de elevación de siempre.
 *
 * DICE LOS DÍAS, NO LA FECHA. «Vence el 12 de octubre» obliga a mirar un
 * calendario para saber si eso es pronto; «faltan 3 días» no. La fecha exacta se
 * enseña al lado, para quien la necesite.
 */
export function SubscriptionBadge({ standing, className }: SubscriptionBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
        STANDING_BADGE[standing.state],
        className
      )}
    >
      {describeStanding(standing)}
    </span>
  )
}
