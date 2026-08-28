import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface UseCountUpOptions {
  /** Valor final al que hay que llegar. */
  target: number
  /** Duración de la cuenta en milisegundos. */
  durationMs?: number
}

/**
 * Contador tipo odómetro: la cifra sube hasta su valor en vez de aparecer.
 *
 * Usa `requestAnimationFrame` y no un `setInterval`: el intervalo se desincroniza
 * del refresco de pantalla y produce saltos, además de seguir corriendo cuando
 * la pestaña está en segundo plano.
 *
 * Si el usuario pidió menos movimiento, devuelve el valor final de inmediato: la
 * animación se omite entera, no se acelera.
 *
 * La cifra que lo muestre debe llevar `.metric-figures`; sin ancho fijo de
 * dígito, el número tiembla en cada fotograma.
 */
export function useCountUp({ target, durationMs = 900 }: UseCountUpOptions): number {
  const prefersReducedMotion = useReducedMotion()
  const [value, setValue] = useState(prefersReducedMotion ? target : 0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target)
      return
    }

    const startedAt = performance.now()
    const from = 0

    const step = (now: number) => {
      const elapsed = now - startedAt
      const ratio = Math.min(elapsed / durationMs, 1)
      // Desaceleracion cubica: arranca rapido y frena al final, que es como se
      // lee un marcador. Una interpolacion lineal parece un cronometro roto.
      const eased = 1 - Math.pow(1 - ratio, 3)
      setValue(from + (target - from) * eased)

      if (ratio < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }

    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [target, durationMs, prefersReducedMotion])

  return value
}
