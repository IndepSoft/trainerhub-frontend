import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { HapticPattern, vibrate } from '@/shared/lib/haptics'

interface UseLongPressOptions {
  onLongPress: () => void
  /** Milisegundos que hay que mantener pulsado. */
  durationMs?: number
  /** Movimiento en píxeles que cancela la pulsación. */
  moveTolerance?: number
}

interface UseLongPressResult {
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: () => void
    onPointerCancel: () => void
    onContextMenu: (event: React.MouseEvent) => void
  }
}

/**
 * Mantener pulsado para abrir acciones rápidas.
 *
 * 500 ms es el umbral que usan iOS y Android para su propio menú contextual.
 * Alinearse con él evita que el usuario perciba la aplicación como lenta o como
 * demasiado sensible respecto al resto del sistema.
 *
 * El movimiento cancela: sin esa tolerancia, empezar a desplazar una lista con
 * el dedo apoyado abriría el menú a mitad de gesto.
 *
 * Se suprime el menú contextual del navegador mientras el gesto está activo: en
 * Android una pulsación larga sobre texto abre el selector nativo y taparía el
 * menú de la aplicación.
 */
export function useLongPress({
  onLongPress,
  durationMs = 500,
  moveTolerance = 10,
}: UseLongPressOptions): UseLongPressResult {
  const timerRef = useRef<number | null>(null)
  const originRef = useRef<{ x: number; y: number } | null>(null)

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    originRef.current = null
  }, [])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      originRef.current = { x: event.clientX, y: event.clientY }
      timerRef.current = window.setTimeout(() => {
        // El resultado se ignora: en iOS no hay vibracion y el menu debe abrirse
        // igual. Ver shared/lib/haptics.
        vibrate(HapticPattern.TAP)
        onLongPress()
        cancel()
      }, durationMs)
    },
    [cancel, durationMs, onLongPress]
  )

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const origin = originRef.current
      if (!origin) return
      const travelled = Math.hypot(event.clientX - origin.x, event.clientY - origin.y)
      if (travelled > moveTolerance) cancel()
    },
    [cancel, moveTolerance]
  )

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
  }, [])

  return {
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onContextMenu: handleContextMenu,
    },
  }
}
