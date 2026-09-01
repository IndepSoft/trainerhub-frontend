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
 * LA ANIMACIÓN ES DECORACIÓN; LA CIFRA ES DATO. De ahí las dos reglas que sigue:
 *
 *  1. Arranca desde lo que hay en pantalla, no desde cero. Antes empezaba
 *     siempre en cero, lo que estaba bien mientras el objetivo no cambiaba
 *     nunca; en cuanto la pantalla de progreso dejó de enseñar un número fijo y
 *     pasó a poder cambiar de alumno, cada cambio hacía caer la cifra a cero
 *     para volver a subir, como una tragaperras.
 *
 *  2. Si la animación no llega a su fin, la cifra se pone igualmente. Los
 *     fotogramas no siempre se entregan —una pestaña en segundo plano no recibe
 *     ninguno— y sin esta garantía el número se queda congelado en el valor
 *     anterior: medido en el panel de vista previa, cambiar de alumno dejaba
 *     «7 días de racha» sobre un alumno que no había entrenado nunca. Un adorno
 *     que no puede ejecutarse no puede impedir que el dato sea correcto.
 *
 * La cifra que lo muestre debe llevar `.metric-figures`; sin ancho fijo de
 * dígito, el número tiembla en cada fotograma.
 */
export function useCountUp({ target, durationMs = 900 }: UseCountUpOptions): number {
  const prefersReducedMotion = useReducedMotion()
  const [value, setValue] = useState(prefersReducedMotion ? target : 0)
  const frameRef = useRef<number | null>(null)
  const fallbackRef = useRef<number | null>(null)

  // El punto de partida se lee de una referencia y no del estado: si fuera una
  // dependencia del efecto, cada fotograma lo reiniciaría.
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target)
      return
    }

    const startedAt = performance.now()
    const from = valueRef.current

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

    // La red de seguridad de la regla 2: pasado el tiempo de la animación, la
    // cifra vale lo que tiene que valer, haya habido fotogramas o no.
    fallbackRef.current = window.setTimeout(() => setValue(target), durationMs + 50)

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      if (fallbackRef.current !== null) window.clearTimeout(fallbackRef.current)
    }
  }, [target, durationMs, prefersReducedMotion])

  return value
}
