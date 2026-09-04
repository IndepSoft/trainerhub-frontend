import { useCallback, useEffect, useRef, useState } from 'react'
import {
  liveSessionMock,
  SIMULATED_CALORIES_PER_SECOND,
  SIMULATED_METERS_PER_SECOND,
} from '../data/liveSession.mock'
import { calculatePaceSeconds } from '../libs/session.utils'
import type {
  LiveSession,
  LiveSessionMetrics,
  LiveSessionState,
} from '../types/session.types'

interface UseLiveSessionResult {
  session: LiveSession
  metrics: LiveSessionMetrics
  state: LiveSessionState
  /** Segundos por kilómetro, o `null` mientras no haya distancia. */
  paceSeconds: number | null
  /** Fracción del trazado ya recorrida, de 0 a 1. */
  routeProgress: number
  pause: () => void
  resume: () => void
  finish: () => void
}

/** Cada cuánto avanza el reloj. Un segundo: la duración se muestra al segundo. */
const TICK_MILLISECONDS = 1000

/**
 * Estado de la sesión en vivo.
 *
 * Es la costura donde entrará el repositorio: hoy el avance lo produce un
 * temporizador sobre datos simulados, y mañana vendrá del GPS y de la
 * persistencia. La página y los componentes reciben las mismas métricas en
 * ambos casos, así que sólo cambia este fichero.
 *
 * El cálculo del ritmo NO vive aquí: se delega en `session.utils`, que es puro.
 * Este hook orquesta estado; no hace aritmética de dominio.
 */
export function useLiveSession(): UseLiveSessionResult {
  const [state, setState] = useState<LiveSessionState>('running')
  const [metrics, setMetrics] = useState<LiveSessionMetrics>(liveSessionMock.metrics)

  // El identificador del intervalo se guarda en una referencia y no en estado:
  // cambiarlo no debe provocar un renderizado.
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (state !== 'running') return

    intervalRef.current = window.setInterval(() => {
      setMetrics((previous) => ({
        elapsedSeconds: previous.elapsedSeconds + 1,
        distanceMeters: previous.distanceMeters + SIMULATED_METERS_PER_SECOND,
        calories: previous.calories + SIMULATED_CALORIES_PER_SECOND,
      }))
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

  const paceSeconds = calculatePaceSeconds(metrics)

  /*
   * El trazado se recorre en proporción al tiempo transcurrido sobre una vuelta
   * completa simulada de doce minutos. Es una decisión del simulador: con GPS
   * real, el avance vendrá de emparejar la posición con el trazado planificado.
   */
  const SIMULATED_LAP_SECONDS = 720
  const routeProgress = Math.min(metrics.elapsedSeconds / SIMULATED_LAP_SECONDS, 1)

  return {
    session: liveSessionMock,
    metrics,
    state,
    paceSeconds,
    routeProgress,
    pause,
    resume,
    finish,
  }
}
