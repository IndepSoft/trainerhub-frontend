import { useCallback, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { HapticPattern, vibrate } from '@/shared/lib/haptics'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  /** Recorrido en píxeles que hay que arrastrar para disparar la recarga. */
  threshold?: number
}

interface UsePullToRefreshResult {
  /** Distancia arrastrada en píxeles, ya amortiguada. La vista la usa para el indicador. */
  pullDistance: number
  isRefreshing: boolean
  /** El arrastre ya supera el umbral: soltar recargará. */
  willRefresh: boolean
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: () => void
    onPointerCancel: () => void
  }
}

/** Resistencia del arrastre: a mayor divisor, más cuesta estirar. */
const DAMPING = 2.5

/**
 * Tirar hacia abajo para recargar.
 *
 * Sólo se activa si el contenedor está arriba del todo (`scrollTop === 0`) en el
 * momento de empezar el arrastre. Sin esa condición, tirar hacia abajo a mitad
 * de una lista dispararía la recarga mientras el usuario sólo quería desplazarse.
 *
 * El arrastre va amortiguado: la distancia visible crece más despacio que el
 * dedo. Es lo que hace que el gesto se sienta elástico en vez de pegado, y lo
 * que comunica que hay un límite.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 72,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startYRef = useRef<number | null>(null)
  const hasPassedThresholdRef = useRef(false)

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.currentTarget.scrollTop > 0) return
    startYRef.current = event.clientY
    hasPassedThresholdRef.current = false
  }, [])

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const startY = startYRef.current
      if (startY === null || isRefreshing) return

      const travelled = event.clientY - startY
      if (travelled <= 0) {
        setPullDistance(0)
        return
      }

      const damped = travelled / DAMPING
      setPullDistance(damped)

      // Un toque háptico justo al cruzar el umbral, una sola vez: es la señal de
      // «ya puedes soltar». En iOS no ocurre nada y el indicador visual lo suple.
      if (!hasPassedThresholdRef.current && damped >= threshold) {
        hasPassedThresholdRef.current = true
        vibrate(HapticPattern.TAP)
      }
    },
    [isRefreshing, threshold]
  )

  const release = useCallback(async () => {
    const shouldRefresh = pullDistance >= threshold
    startYRef.current = null
    hasPassedThresholdRef.current = false
    setPullDistance(0)

    if (!shouldRefresh || isRefreshing) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, onRefresh, pullDistance, threshold])

  return {
    pullDistance,
    isRefreshing,
    willRefresh: pullDistance >= threshold,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: release,
      onPointerCancel: release,
    },
  }
}
