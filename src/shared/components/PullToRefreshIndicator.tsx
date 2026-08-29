import { RefreshCw } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface PullToRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
  willRefresh: boolean
}

/**
 * Indicador del gesto de tirar para recargar.
 *
 * Ocupa altura real -no va superpuesto- para que el contenido se desplace hacia
 * abajo con el dedo. Un indicador flotante sobre el contenido rompe la
 * sensación de estar arrastrando la lista.
 *
 * El icono gira en proporción al arrastre, así que el movimiento del dedo y el
 * de la pantalla van sincronizados. Al soltar, gira solo.
 */
export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  willRefresh,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null

  const height = isRefreshing ? 56 : Math.min(pullDistance, 96)

  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{ height }}
      aria-live="polite"
    >
      <RefreshCw
        className={cn(
          'size-5',
          willRefresh || isRefreshing ? 'text-cobalt' : 'text-ink/30',
          // `motion-safe` para que con movimiento reducido no gire.
          isRefreshing && 'motion-safe:animate-spin'
        )}
        style={isRefreshing ? undefined : { transform: `rotate(${pullDistance * 3}deg)` }}
      />
      <span className="sr-only">
        {isRefreshing ? 'Actualizando' : willRefresh ? 'Suelta para actualizar' : 'Tira para actualizar'}
      </span>
    </div>
  )
}
