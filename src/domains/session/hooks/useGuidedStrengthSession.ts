import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Routine } from '@/shared/domain/entities/routine'
import type { SetRecord } from '@/shared/domain/entities/session'
import { buildSetPlan, maxReps, type SetStep } from '../libs/setPlan'
import type { LiveSessionState } from '../types/session.types'

/**
 * En qué está la sesión ahora mismo.
 *
 * `rest` es una fase de pleno derecho y no un hueco entre series: tiene su
 * propio reloj, se contrasta con el descanso prescrito, y es donde de verdad
 * está quien entrena la mitad del tiempo. Tratarlo como ausencia de fase era lo
 * que hacía que la pantalla anterior no tuviera nada que decir entre serie y
 * serie.
 */
export type SessionPhase = 'work' | 'rest' | 'done'

interface UseGuidedStrengthSessionResult {
  /** Las series en el orden en que toca hacerlas. Vacío sin rutina. */
  steps: SetStep[]
  currentIndex: number
  currentStep: SetStep | null
  phase: SessionPhase
  state: LiveSessionState
  /** Reloj de toda la sesión. */
  elapsedSeconds: number
  /** Reloj de la fase en curso: lo que lleva esta serie, o este descanso. */
  phaseSeconds: number
  /** Repeticiones marcadas en la serie en curso. */
  repsDone: number
  /**
   * Peso de la serie en curso, en kilos. `null` mientras no se haya anotado.
   *
   * `null` y no cero: cero es un peso —una barra vacía, un lastre que se quita—
   * y «no lo he anotado» es otra cosa. Confundirlos llenaría el historial de
   * ceros que parecerían mediciones.
   */
  weightKg: number | null
  /** Cuántos círculos pintar: el tope del rango prescrito. */
  targetReps: number
  records: SetRecord[]
  doneSets: number
  totalSets: number
  /** De 0 a 1. Lo que llevan hecho, en series. */
  progress: number
  /** Marca hasta la repetición `count`. Volver a tocar la última la desmarca. */
  markReps: (count: number) => void
  /** Fija el peso de la serie en curso. `null` lo deja sin anotar. */
  setWeight: (kilos: number | null) => void
  /** Sube o baja el peso. Desde «sin anotar» arranca en el propio incremento. */
  adjustWeight: (delta: number) => void
  /** Cierra la serie en curso y abre el descanso, o la siguiente serie. */
  finishSet: () => void
  /** Termina el descanso antes de tiempo y arranca la serie siguiente. */
  startNextSet: () => void
  pause: () => void
  resume: () => void
}

/** Cada cuánto avanza el reloj. Un segundo: la duración se muestra al segundo. */
const TICK_MILLISECONDS = 1000

/**
 * Una sesión de fuerza GUIADA, serie a serie.
 *
 * LA PANTALLA ANTERIOR NO GUIABA NADA: pintaba la rutina entera y contaba series
 * marcadas. Servía de recordatorio de lo que tocaba, no de acompañamiento
 * mientras se hace, y el único dato que producía era «cuántas series marqué».
 *
 * Aquí la sesión sabe EN QUÉ SERIE VA. Cada serie tiene su reloj, se cierra a
 * mano, y al cerrarla empieza el descanso con el suyo. Lo que sale de ahí son
 * datos medidos —repeticiones hechas, segundos de trabajo, segundos de descanso
 * reales— que se pueden contrastar con lo prescrito.
 *
 * LO MEDIDO SE GUARDA, LO JUZGADO NO. El hook no decide si una serie fue rápida
 * o lenta: eso lo calcula `setPerformance` a partir de estos números, y así un
 * cambio de criterio no reescribe el historial.
 *
 * TODO: el descanso no avisa cuando termina. La cuenta atrás llega a cero y
 * sigue, pero nadie mira el teléfono los dos minutos enteros. Falta un aviso
 * —sonido o vibración— y es trabajo aparte: hay que decidir qué pasa con la
 * pantalla apagada y con el permiso de sonido.
 *
 * TODO: no se puede deshacer una serie cerrada. Equivocarse es normal y hoy la
 * única salida es terminar la sesión y rehacerla.
 */
export function useGuidedStrengthSession(
  routine: Routine | null,
  /**
   * Lo que se levantó la última vez en cada ejercicio. Ver `useLastWeights`.
   *
   * Llega de fuera y no se pide aquí dentro para que este hook siga sin conocer
   * ningún puerto: sabe conducir una sesión, no leer el historial.
   */
  lastWeights: Map<string, number> = new Map()
): UseGuidedStrengthSessionResult {
  const steps = useMemo(() => buildSetPlan(routine), [routine])

  const [state, setState] = useState<LiveSessionState>('running')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [phaseSeconds, setPhaseSeconds] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<SessionPhase>('work')
  const [repsDone, setRepsDone] = useState(0)
  const [weightKg, setWeightKg] = useState<number | null>(null)
  const [records, setRecords] = useState<SetRecord[]>([])

  // El identificador del intervalo va en una referencia: cambiarlo no debe
  // provocar un renderizado.
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (state !== 'running' || phase === 'done') return

    intervalRef.current = window.setInterval(() => {
      setElapsedSeconds((previous) => previous + 1)
      setPhaseSeconds((previous) => previous + 1)
    }, TICK_MILLISECONDS)

    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [state, phase])

  const currentStep = steps[currentIndex] ?? null
  const targetReps = currentStep === null ? 0 : maxReps(currentStep.reps)

  const markReps = useCallback((count: number) => {
    // Volver a tocar la ultima marcada la desmarca: es como se corrige una
    // repeticion de mas sin tener que empezar de cero.
    setRepsDone((previous) => (previous === count ? count - 1 : count))
  }, [])

  const setWeight = useCallback((kilos: number | null) => setWeightKg(kilos), [])

  const adjustWeight = useCallback(
    (delta: number) => {
      // Desde «sin anotar» el primer toque deja el propio incremento, no cero:
      // pulsar «+2,5» sin haber puesto nada quiere decir 2,5.
      setWeightKg((previous) => Math.max((previous ?? 0) + delta, 0))
    },
    []
  )

  /**
   * El peso con el que arranca una serie: lo último anotado de ESE ejercicio.
   *
   * Del ejercicio y no de la serie anterior, que en una superserie es otro
   * ejercicio con otra carga. Se mira primero lo hecho hoy y, si es la primera
   * serie del día, lo de la última sesión: a «¿cuánto pongo?» las dos responden
   * lo mismo, y teclearlo otra vez es lo que hace que se deje de anotar.
   */
  const carriedWeight = useCallback(
    (exerciseId: string, done: SetRecord[]): number | null => {
      for (let index = done.length - 1; index >= 0; index -= 1) {
        const record = done[index]
        if (record.exerciseId === exerciseId && record.weightKg !== undefined) {
          return record.weightKg
        }
      }

      return lastWeights.get(exerciseId) ?? null
    },
    [lastWeights]
  )

  /*
   * La PRIMERA serie, cuando llega el historial.
   *
   * `useLastWeights` resuelve tarde -es una consulta- y la pantalla ya se ha
   * pintado. La guarda evita que ese retraso pise el peso de una serie que ya
   * se esté haciendo: sólo se aplica si todavía no se ha cerrado ninguna.
   */
  useEffect(() => {
    const first = steps[0]
    if (first === undefined || currentIndex !== 0 || records.length > 0) return

    setWeightKg(lastWeights.get(first.exerciseId) ?? null)
  }, [steps, lastWeights, currentIndex, records.length])

  const advance = useCallback(
    (done: SetRecord[]) => {
      const next = currentIndex + 1
      setCurrentIndex(next)
      setPhase(next >= steps.length ? 'done' : 'work')
      setRepsDone(0)
      setPhaseSeconds(0)

      const nextStep = steps[next]
      setWeightKg(nextStep === undefined ? null : carriedWeight(nextStep.exerciseId, done))
    },
    [carriedWeight, currentIndex, steps]
  )

  const finishSet = useCallback(() => {
    if (currentStep === null || phase !== 'work') return

    const closed: SetRecord[] = [
      ...records,
      {
        stepId: currentStep.id,
        prescribedId: currentStep.prescribedId,
        exerciseId: currentStep.exerciseId,
        setNumber: currentStep.setNumber,
        prescribedReps: currentStep.reps,
        repsDone,
        // Sin anotar se guarda AUSENTE, no cero. Ver `SetRecord.weightKg`.
        weightKg: weightKg ?? undefined,
        workSeconds: phaseSeconds,
        // El descanso todavia no ha ocurrido: se anota al terminarlo.
        restSeconds: 0,
        prescribedRestSeconds: currentStep.restSecondsAfter,
      },
    ]

    setRecords(closed)

    const isLast = currentIndex >= steps.length - 1

    /*
     * Sin descanso prescrito -o en la ultima serie- se pasa directo. Abrir un
     * descanso de cero segundos obligaria a un toque de mas para nada, y en una
     * superserie ese toque estaria justo donde no hay que parar.
     */
    if (currentStep.restSecondsAfter === 0 || isLast) {
      advance(closed)
      return
    }

    setPhase('rest')
    setPhaseSeconds(0)
  }, [
    advance,
    currentIndex,
    currentStep,
    phase,
    phaseSeconds,
    records,
    repsDone,
    steps.length,
    weightKg,
  ])

  const startNextSet = useCallback(() => {
    if (phase !== 'rest') return

    // El descanso REAL se anota en la serie que lo provoco, no en la siguiente:
    // es una propiedad de como se ejecuto esa serie.
    const rested = records.map((record, index) =>
      index === records.length - 1 ? { ...record, restSeconds: phaseSeconds } : record
    )

    setRecords(rested)
    advance(rested)
  }, [advance, phase, phaseSeconds, records])

  const pause = useCallback(() => setState('paused'), [])
  const resume = useCallback(() => setState('running'), [])

  const doneSets = records.length

  return {
    steps,
    currentIndex,
    currentStep,
    phase,
    state,
    elapsedSeconds,
    phaseSeconds,
    repsDone,
    weightKg,
    targetReps,
    records,
    doneSets,
    totalSets: steps.length,
    progress: steps.length === 0 ? 0 : doneSets / steps.length,
    markReps,
    setWeight,
    adjustWeight,
    finishSet,
    startNextSet,
    pause,
    resume,
  }
}
