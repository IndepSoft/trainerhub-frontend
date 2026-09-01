import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { countTotalSets } from '@/shared/domain/routineMetrics'
import type { Routine } from '@/shared/domain/entities/routine'
import type { LiveSessionState } from '../types/session.types'

interface UseStrengthSessionResult {
  elapsedSeconds: number
  state: LiveSessionState
  /** Series marcadas de cada ejercicio prescrito, por su identificador. */
  doneByExercise: Map<string, number>
  doneSets: number
  totalSets: number
  /** De 0 a 1. Lo que llevan hecho, en series. */
  progress: number
  markSet: (prescribedExerciseId: string, prescribedSets: number) => void
  unmarkSet: (prescribedExerciseId: string) => void
  pause: () => void
  resume: () => void
}

/** Cada cuánto avanza el reloj. Un segundo: la duración se muestra al segundo. */
const TICK_MILLISECONDS = 1000

/**
 * Estado de una sesión de fuerza en marcha.
 *
 * Lleva DOS cosas: el reloj y las series hechas. El avance se mide en series y
 * no en ejercicios porque es la unidad en la que se programa —«cuántas series de
 * pecho llevo»— y porque un ejercicio de cuatro series no está «hecho a medias»
 * cuando van dos: van dos.
 *
 * No calcula duraciones ni volumen: eso ya vive en `shared/domain/routineMetrics`,
 * y tener dos fórmulas para la misma cifra es cómo se separan.
 */
export function useStrengthSession(routine: Routine | null): UseStrengthSessionResult {
  const [state, setState] = useState<LiveSessionState>('running')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [doneByExercise, setDoneByExercise] = useState<Map<string, number>>(new Map())

  // El identificador del intervalo va en una referencia: cambiarlo no debe
  // provocar un renderizado.
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (state !== 'running') return

    intervalRef.current = window.setInterval(() => {
      setElapsedSeconds((previous) => previous + 1)
    }, TICK_MILLISECONDS)

    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [state])

  const totalSets = useMemo(() => (routine === null ? 0 : countTotalSets(routine)), [routine])

  const doneSets = useMemo(
    () => [...doneByExercise.values()].reduce((total, done) => total + done, 0),
    [doneByExercise]
  )

  const markSet = useCallback((prescribedExerciseId: string, prescribedSets: number) => {
    setDoneByExercise((current) => {
      const done = current.get(prescribedExerciseId) ?? 0
      // No se pasa de lo prescrito: marcar una quinta serie de cuatro no
      // significaría nada y descuadraría el avance.
      if (done >= prescribedSets) return current

      const next = new Map(current)
      next.set(prescribedExerciseId, done + 1)
      return next
    })
  }, [])

  const unmarkSet = useCallback((prescribedExerciseId: string) => {
    setDoneByExercise((current) => {
      const done = current.get(prescribedExerciseId) ?? 0
      if (done === 0) return current

      const next = new Map(current)
      next.set(prescribedExerciseId, done - 1)
      return next
    })
  }, [])

  const pause = useCallback(() => setState('paused'), [])
  const resume = useCallback(() => setState('running'), [])

  return {
    elapsedSeconds,
    state,
    doneByExercise,
    doneSets,
    totalSets,
    progress: totalSets === 0 ? 0 : doneSets / totalSets,
    markSet,
    unmarkSet,
    pause,
    resume,
  }
}
