import { Check, Lock, ShieldCheck } from 'lucide-react'
import { Progress } from '@/shared/ui/progress'
import { cn } from '@/shared/lib/utils'
import type { PathNode, PathNodeState } from '../types/gamification.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface RouteNodeProps {
  node: PathNode
  isLast: boolean
  /**
   * Si el nodo SIGUIENTE está bloqueado. El tramo de línea describe hacia dónde
   * lleva, no dónde está: puntearlo según el estado del nodo actual dejaba el
   * tramo que entra en territorio bloqueado dibujado como si fuera transitable.
   */
  leadsToLocked: boolean
}

const NODE_STYLES: Record<PathNodeState, string> = {
  completed: 'bg-cobalt border-cobalt text-white',
  active: 'bg-ember border-ember text-white',
  locked: 'bg-bone border-cobalt-tint-3 text-ink/25',
}

const TITLE_STYLES: Record<PathNodeState, string> = {
  completed: 'text-ink',
  active: 'text-ink',
  locked: 'text-ink/35',
}

function fraction(current: number, target: number): number {
  return target === 0 ? 1 : Math.min(1, current / target)
}

/**
 * Un nodo del sendero.
 *
 * El estado se lee sin necesidad de leer texto: relleno para lo hecho, Ember
 * para lo que toca ahora, contorno hueco y candado para lo que aún no. El tramo
 * de línea hacia el siguiente nodo va punteado cuando lo que viene está
 * bloqueado, que es la forma de decir «todavía no» sin escribirlo.
 *
 * El nodo activo enseña sus TRES criterios: puntos, semanas y la validación
 * del entrenador. Los dos primeros son barras; el tercero es una frase, porque
 * no lo mueve el alumno.
 */
export function RouteNode({ node, isLast, leadsToLocked }: RouteNodeProps) {
  const { t } = useTranslation()
  const isLocked = node.state === 'locked'
  const isActive = node.state === 'active'

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
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-ember/30 motion-safe:animate-ping"
          />
        )}
        <span
          className={cn(
            'relative flex size-9 items-center justify-center rounded-full border-2',
            NODE_STYLES[node.state]
          )}
        >
          {node.state === 'completed' && <Check className="size-4" strokeWidth={3} />}
          {isLocked && <Lock className="size-3.5" strokeWidth={2.5} />}
          {isActive && <span className="size-2 rounded-full bg-surface" />}
        </span>
      </span>

      <div className="min-w-0 flex-1 pt-1">
        <h3 className={cn('font-semibold', TITLE_STYLES[node.state])}>{t(node.titleKey)}</h3>
        <p className={cn('text-sm', isLocked ? 'text-ink/30' : 'text-ink/50')}>
          {t(node.descriptionKey)}
        </p>

        {isActive && (
          <dl className="mt-3 space-y-2">
            <Criterion
              label={t('route.criterion.points')}
              current={node.points.current}
              target={node.points.target}
            />
            <Criterion
              label={t('route.criterion.weeks')}
              current={node.weeks.current}
              target={node.weeks.target}
            />
            {node.needsValidation && (
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className={cn('size-3.5', node.validated ? 'text-cobalt' : 'text-ink/35')} />
                <span className={node.validated ? 'text-ink' : 'text-ink/55'}>
                  {node.validated ? t('route.criterion.validated') : t('route.criterion.pendingValidation')}
                </span>
              </div>
            )}
          </dl>
        )}
      </div>
    </li>
  )
}

interface CriterionProps {
  label: string
  current: number
  target: number
}

function Criterion({ label, current, target }: CriterionProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[11px]">
        <dt className="font-semibold uppercase tracking-[0.14em] text-ink/55">{label}</dt>
        <dd className="metric-figures font-semibold text-ink/45">
          {current}/{target}
        </dd>
      </div>
      <Progress
        value={fraction(current, target) * 100}
        className="mt-1 h-1.5 bg-cobalt-tint-2 [&>[data-slot=progress-indicator]]:bg-ember"
      />
    </div>
  )
}
