import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  /** Distancia mínima en píxeles para que cuente como deslizamiento. */
  threshold?: number
}

interface UseSwipeResult {
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: () => void
  }
}

/**
 * Deslizamiento horizontal para pasar de una vista a la siguiente.
 *
 * Distinto de `useSlideToConfirm`: aquel protege una accion irreversible y
 * necesita que el usuario recorra la barra entera; este solo detecta la
 * intencion de pasar pagina y se dispara al soltar.
 *
 * El umbral de 60 px no es arbitrario: por debajo, un desplazamiento vertical
 * con algo de inclinacion -que es como se desplaza una lista con el pulgar-
 * dispararia el cambio de vista sin querer.
 *
 * Se compara ademas el recorrido horizontal con el vertical y solo cuenta si
 * domina el horizontal. Sin esa comprobacion, desplazar una lista larga cambia
 * de pestana a mitad de gesto.
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
}: UseSwipeOptions): UseSwipeResult {
  const originRef = useRef<{ x: number; y: number } | null>(null)

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    originRef.current = { x: event.clientX, y: event.clientY }
  }, [])

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const origin = originRef.current
      originRef.current = null
      if (!origin) return

      const travelledX = event.clientX - origin.x
      const travelledY = event.clientY - origin.y

      if (Math.abs(travelledX) < threshold) return
      if (Math.abs(travelledX) <= Math.abs(travelledY)) return

      if (travelledX < 0) onSwipeLeft?.()
      else onSwipeRight?.()
    },
    [onSwipeLeft, onSwipeRight, threshold]
  )

  const handlePointerCancel = useCallback(() => {
    originRef.current = null
  }, [])

  return {
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  }
}
