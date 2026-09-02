import { Check, Lock } from 'lucide-react'
import { Progress } from '@/shared/ui/progress'
import { cn } from '@/shared/lib/utils'
import { calculateMilestoneCompletion } from '../libs/gamification.utils'
import type { Milestone, MilestoneState } from '../types/gamification.types'

interface MilestoneNodeProps {
  milestone: Milestone
  isLast: boolean
  /**
   * Si el hito SIGUIENTE está bloqueado. El tramo de línea describe hacia dónde
   * lleva, no dónde está: puntearlo según el estado del nodo actual dejaba el
   * tramo que entra en territorio bloqueado dibujado como si fuera transitable.
   */
  leadsToLocked: boolean
}

const NODE_STYLES: Record<MilestoneState, string> = {
  completed: 'bg-cobalt border-cobalt text-white',
  active: 'bg-ember border-ember text-white',
  locked: 'bg-bone border-cobalt-tint-3 text-ink/25',
}

const TITLE_STYLES: Record<MilestoneState, string> = {
  completed: 'text-ink',
  active: 'text-ink',
  locked: 'text-ink/35',
}

/**
 * Un hito del sendero.
 *
 * El estado se lee sin necesidad de leer texto: relleno para lo hecho, Ember
 * para lo que toca ahora, contorno hueco y candado para lo que aún no. El tramo
 * de línea hacia el siguiente hito va punteado cuando lo que viene está
 * bloqueado, que es la forma de decir «todavía no» sin escribirlo.
 */
export function MilestoneNode({
  milestone,
  isLast,
  leadsToLocked,
}: MilestoneNodeProps) {
  const completion = calculateMilestoneCompletion(milestone)
  const isLocked = milestone.state === 'locked'
  const isActive = milestone.state === 'active'

  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      {!isLast && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute left-[17px] top-10 bottom-0 w-0.5',
            leadsToLocked ? 'bg-transparent' : 'bg-cobalt-tint-3'
          )}
          style={
            leadsToLocked
              ? {
                  // Punteado dibujado con un degradado repetido: una linea
                  // discontinua real necesitaria un borde, que ocuparia otro
                  // pixel y desalinearia el nodo.
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, hsl(var(--cobalt-tint-3)) 0 6px, transparent 6px 12px)',
                }
              : undefined
          }
        />
      )}

      <span className="relative z-10 flex size-9 shrink-0 items-center justify-center">
        {/* El pulso va en un anillo detras y no sobre el nodo: `animate-pulse`
            baja la opacidad del elemento al que se aplica, asi que ponerlo en el
            nodo dejaba el hito mas importante como el mas palido de la lista.
            `motion-safe` lo apaga con prefers-reduced-motion. */}
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-ember/30 motion-safe:animate-ping"
          />
        )}

        <span
          className={cn(
            'relative flex size-9 items-center justify-center rounded-full border-2',
            NODE_STYLES[milestone.state]
          )}
        >
        {milestone.state === 'completed' && <Check className="size-4" strokeWidth={3} />}
        {isLocked && <Lock className="size-3.5" strokeWidth={2.5} />}
          {isActive && <span className="size-2 rounded-full bg-surface" />}
        </span>
      </span>

      <div className="min-w-0 flex-1 pt-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className={cn('font-semibold', TITLE_STYLES[milestone.state])}>
            {milestone.title}
          </h3>
          <span
            className={cn(
              'metric-figures shrink-0 text-[11px] font-semibold uppercase tracking-wider',
              isLocked ? 'text-ink/25' : 'text-cobalt'
            )}
          >
            +{milestone.experienceReward} XP
          </span>
        </div>

        <p className={cn('text-sm', isLocked ? 'text-ink/30' : 'text-ink/50')}>
          {milestone.description}
        </p>

        {!isLocked && (
          <div className="mt-3 flex items-center gap-3">
            <Progress
              value={completion * 100}
              className={cn(
                'h-1.5 flex-1 bg-cobalt-tint-2',
                isActive
                  ? '[&>[data-slot=progress-indicator]]:bg-ember'
                  : '[&>[data-slot=progress-indicator]]:bg-cobalt'
              )}
            />
            <span className="metric-figures shrink-0 text-[11px] font-semibold text-ink/45">
              {milestone.completedSessions}/{milestone.requiredSessions}
            </span>
          </div>
        )}
      </div>
    </li>
  )
}
