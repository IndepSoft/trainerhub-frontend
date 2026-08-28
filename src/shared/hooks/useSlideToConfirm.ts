import { useCallback, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { HapticPattern, vibrate } from '@/shared/lib/haptics'

interface UseSlideToConfirmOptions {
  onConfirm: () => void
  /** Fracción del recorrido que hay que superar para confirmar. Por defecto 0,85. */
  threshold?: number
}

interface UseSlideToConfirmResult {
  /** Progreso del arrastre, de 0 a 1. La vista lo usa para desplazar el tirador. */
  progress: number
  isDragging: boolean
  /** Se reparten sobre el elemento arrastrable. */
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
  }
}

/**
 * Gesto de «deslizar para confirmar».
 *
 * Existe para acciones que no deben poder dispararse por un roce: pausar una
 * sesión en marcha, finalizarla. Un botón normal se pulsa sin querer con el
 * teléfono en la mano.
 *
 * Usa eventos de puntero y no de ratón o táctiles por separado: `pointer*` cubre
 * dedo, ratón y lápiz con un solo camino de código, y `setPointerCapture`
 * mantiene el seguimiento aunque el dedo se salga del elemento.
 *
 * Accesibilidad: este hook cubre el gesto, no el teclado. El componente que lo
 * use debe ofrecer además un control accionable con teclado, porque un gesto de
 * arrastre no es alcanzable con navegación por tabulación.
 */
export function useSlideToConfirm({
  onConfirm,
  threshold = 0.85,
}: UseSlideToConfirmOptions): UseSlideToConfirmResult {
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<{ left: number; width: number } | null>(null)

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const track = event.currentTarget.getBoundingClientRect()
    trackRef.current = { left: track.left, width: track.width }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }, [])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const track = trackRef.current
    if (!track || track.width === 0) return
    const travelled = (event.clientX - track.left) / track.width
    setProgress(Math.min(Math.max(travelled, 0), 1))
  }, [])

  const release = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      setIsDragging(false)

      setProgress((current) => {
        if (current >= threshold) {
          // El resultado se ignora a proposito: en iOS no hay vibracion y eso no
          // debe impedir la accion. La senal visual la da el propio gesto al
          // completarse.
          vibrate(HapticPattern.TRANSITION)
          onConfirm()
        }
        return 0
      })
    },
    [onConfirm, threshold]
  )

  return {
    progress,
    isDragging,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: release,
      onPointerCancel: release,
    },
  }
}
