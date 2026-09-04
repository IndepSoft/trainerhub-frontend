import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export type TimelineNodeState = 'done' | 'active' | 'pending'

export interface TimelineEntryProps {
  state?: TimelineNodeState
  /** Marca temporal a la izquierda del nodo: hora, dia o etiqueta corta. */
  stamp?: string
  children: ReactNode
  isLast?: boolean
}

const NODE_STYLES: Record<TimelineNodeState, string> = {
  done: 'bg-cobalt border-cobalt',
  active: 'bg-ember border-ember',
  pending: 'bg-bone border-cobalt-tint-3',
}

/**
 * Linea vertical continua con nodos, al modo del feed de la app Moves.
 *
 * Es el sustituto explicito del apilado de tarjetas: una sola linea recorre
 * todas las entradas en vez de que cada una traiga su propio borde. La
 * separacion entre elementos la da el espaciado, no una caja.
 */
export function Timeline({ children }: { children: ReactNode }) {
  return <ol className="relative">{children}</ol>
}

export function TimelineEntry({
  state = 'done',
  stamp,
  children,
  isLast = false,
}: TimelineEntryProps) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {/* El tramo de linea se dibuja por entrada y se omite en la ultima, para
          que la linea no sobresalga por debajo del ultimo nodo. */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute left-[7px] top-4 bottom-0 w-px bg-cobalt-tint-3"
        />
      )}

      <span
        aria-hidden="true"
        className={cn(
          'relative z-10 mt-1 size-[15px] shrink-0 rounded-full border-2',
          NODE_STYLES[state]
        )}
      />

      <div className="min-w-0 flex-1 pb-1">
        {stamp && (
          <p className="metric-figures text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
            {stamp}
          </p>
        )}
        {children}
      </div>
    </li>
  )
}
