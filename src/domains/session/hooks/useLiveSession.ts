import { useCallback, useEffect, useRef, useState } from 'react'
import type { LiveSessionState } from '../types/session.types'

interface UseLiveSessionResult {
  elapsedSeconds: number
  state: LiveSessionState
  pause: () => void
  resume: () => void
  finish: () => void
}

/** Cada cuánto avanza el reloj. Un segundo: la duración se muestra al segundo. */
const TICK_MILLISECONDS = 1000

/**
 * El reloj de una sesión de cardio.
 *
 * MIDE SOLO TIEMPO, y arranca en cero. Antes arrancaba en siete minutos con
 * distancia, calorías, ritmo y un trazado GPS que no venían de ningún sitio:
 * eran una semilla y un contador que la hacía crecer. Un entrenador que abría
 * una sesión de cardio veía cifras inventadas con aspecto de medidas, y en un
 * teléfono el letrero «GPS» prometía algo que no existe. Sin sensor no hay
 * distancia; el tiempo sí es real, y es lo que se anota al cerrar.
 *
 * Cuando haya GPS, la distancia entra por un puerto y este hook la recibe; la
 * pantalla la pinta si viene y no la finge si no.
 */
export function useLiveSession(): UseLiveSessionResult {
  const [state, setState] = useState<LiveSessionState>('running')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // El identificador del intervalo se guarda en una referencia y no en estado:
  // cambiarlo no debe provocar un renderizado.
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (state !== 'running') return

    intervalRef.current = window.setInterval(() => {
      setElapsedSeconds((previous) => previous + 1)
    }, TICK_MILLISECONDS)

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state])

  const pause = useCallback(() => setState('paused'), [])
  const resume = useCallback(() => setState('running'), [])
  const finish = useCallback(() => setState('finished'), [])

  return { elapsedSeconds, state, pause, resume, finish }
}
