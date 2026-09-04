import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Routine } from '@/shared/domain/entities/routine'
import type { SetRecord } from '@/shared/domain/entities/session'
import { buildSetPlan, maxReps, type SetStep } from '../libs/setPlan'
import type { LiveSessionState } from '../types/session.types'
import { HapticPattern, vibrate } from '@/shared/lib/haptics'
import { cancelRestChime, primeRestChime, scheduleRestChime } from '@/shared/lib/restChime'
import { useSoundPreference } from '@/shared/hooks/useSoundPreference'

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
  /**
   * Reabre la última serie cerrada, con lo que se anotó en ella.
   *
   * Equivocarse contando es lo más normal del mundo, y hasta ahora la única
   * salida era terminar la sesión y rehacerla entera.
   */
  undoLastSet: () => void
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
  /*
   * El sonido se consulta AQUÍ y no dentro de `scheduleRestChime`.
   *
   * Podría comprobarlo la propia función y ahorrarse esta línea, pero entonces
   * el comportamiento del hook dependería de un estado global invisible desde
   * su código. Leyéndola aquí, la condición que decide si suena está al lado del
   * `if` que lo decide, y se puede seguir leyendo.
   *
   * Es una preferencia del navegador, como `useReducedMotion`, no un puerto:
   * este hook sigue sin conocer ninguno.
   */
  const { soundEnabled } = useSoundPreference()

  const [state, setState] = useState<LiveSessionState>('running')
  /*
   * LOS RELOJES MIDEN TIEMPO, NO TICS.
   *
   * La primera versión sumaba uno por cada `setInterval`, y eso da un reloj que
   * se para: el navegador estrangula los temporizadores de una pestaña en
   * segundo plano —medido aquí: dos segundos contados en dos minutos reales— y
   * con el móvil bloqueado entre series, que es lo normal, los segundos que se
   * guardaban en cada `SetRecord` habrían sido falsos.
   *
   * Ahora se guarda CUÁNDO empezó cada cosa y el tiempo se resta de `Date.now()`.
   * El intervalo ya sólo sirve para repintar; si se estrangula, la cifra se
   * refresca más tarde pero nunca se equivoca.
   *
   * `accumulated` es lo corrido antes de la pausa en curso: pausar congela ahí y
   * reanudar vuelve a anclar el reloj.
   */
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now())
  const [sessionAccumulated, setSessionAccumulated] = useState(0)
  const [phaseStartedAt, setPhaseStartedAt] = useState(() => Date.now())
  const [phaseAccumulated, setPhaseAccumulated] = useState(0)
  /* Sólo provoca el repintado. El valor que importa sale de las marcas de tiempo. */
  const [now, setNow] = useState(() => Date.now())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<SessionPhase>('work')
  const [repsDone, setRepsDone] = useState(0)
  /*
   * Lo decidido A MANO para la serie en curso. `undefined` es «todavía nadie ha
   * tocado el peso», que NO es lo mismo que `null` —«lo he dejado en blanco a
   * propósito»—. La diferencia es lo que permite que el valor de partida se
   * derive sin pisar lo que se acaba de escribir.
   */
  const [chosenWeight, setChosenWeight] = useState<number | null | undefined>(undefined)
  const [records, setRecords] = useState<SetRecord[]>([])

  // El identificador del intervalo va en una referencia: cambiarlo no debe
  // provocar un renderizado.
  const intervalRef = useRef<number | null>(null)
  /** La serie cuyo descanso ya se avisó, para no repetirlo en cada repintado. */
  const signalledRestRef = useRef<string | null>(null)

  useEffect(() => {
    if (state !== 'running' || phase === 'done') return

    intervalRef.current = window.setInterval(() => setNow(Date.now()), TICK_MILLISECONDS)

    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [state, phase])

  /*
   * Al volver de segundo plano, la cifra se pone al día sin esperar al tic.
   *
   * El valor nunca fue incorrecto -sale de restar marcas de tiempo-, pero lo que
   * se PINTA depende del último repintado, y con la pestaña estrangulada ése
   * puede ser de hace un minuto. Quien desbloquea el móvil vería el reloj
   * parado durante un segundo, que es exactamente la sensación que este cambio
   * venía a quitar.
   */
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }

    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])

  /**
   * Los segundos corridos de un reloj, medidos EN EL INSTANTE QUE SE PIDA.
   *
   * `at` es el parámetro que importa: para pintar se pasa `now` —el del último
   * repintado, que basta— y para GUARDAR se pasa `Date.now()`. Guardar con `now`
   * anotaría los segundos que la pantalla alcanzó a contar y no los que la serie
   * duró, que es justo el error que se venía a corregir.
   */
  const secondsOf = useCallback(
    (anchor: number, accumulated: number, at: number): number =>
      accumulated + (state === 'running' && phase !== 'done' ? Math.floor((at - anchor) / 1000) : 0),
    [state, phase]
  )

  const elapsedSeconds = secondsOf(sessionStartedAt, sessionAccumulated, now)
  const phaseSeconds = secondsOf(phaseStartedAt, phaseAccumulated, now)

  /** Arranca de cero el reloj de la fase, o desde lo que ya llevaba. */
  const restartPhaseClock = useCallback((from = 0) => {
    setPhaseAccumulated(from)
    setPhaseStartedAt(Date.now())
    setNow(Date.now())
  }, [])

  const currentStep = steps[currentIndex] ?? null
  const targetReps = currentStep === null ? 0 : maxReps(currentStep.reps)

  /*
   * El aviso al cumplirse el descanso.
   *
   * LA CUENTA ATRÁS NO BASTABA: llegaba a cero y seguía, pero nadie mira el
   * teléfono los dos minutos enteros, que es justamente el problema que la
   * cuenta atrás venía a resolver.
   *
   * Se dispara al CRUZAR el prescrito, y una sola vez por descanso: lo recuerda
   * una referencia. Comparar por igualdad exacta habría sido más corto y estaría
   * mal desde que los relojes miden tiempo en vez de tics: con la pestaña
   * estrangulada el reloj salta de 118 a 130 y el aviso no llegaría nunca.
   *
   * SON TRES SEÑALES A LA VEZ y ninguna sobra, porque ninguna llega sola a todas
   * las situaciones: el COLOR no sirve con el teléfono en el bolsillo, la
   * VIBRACIÓN no existe en iOS —`vibrate` devuelve si hubo respuesta y aquí se
   * ignora a propósito—, y el SONIDO se apaga en una sala compartida o con el
   * móvil en silencio. Juntas cubren el caso normal de un descanso: el teléfono
   * guardado y dos minutos sin mirarlo.
   *
   * AQUÍ SÓLO VAN LAS DOS QUE DEPENDEN DE LA PANTALLA. Este efecto se despierta
   * con el repintado, y con la pestaña en segundo plano el navegador lo
   * estrangula a uno por minuto: medido aquí, la cuenta atrás congelada en 0:08
   * durante quince segundos. El color y la vibración llegan tarde en ese caso y
   * no hay forma de evitarlo desde el hilo principal. El sonido sí, y por eso se
   * programa aparte: ver el efecto de abajo.
   */
  useEffect(() => {
    if (phase !== 'rest' || currentStep === null) {
      signalledRestRef.current = null
      return
    }

    if (phaseSeconds < currentStep.restSecondsAfter) return
    if (signalledRestRef.current === currentStep.id) return

    signalledRestRef.current = currentStep.id
    vibrate(HapticPattern.TRANSITION)
  }, [phase, phaseSeconds, currentStep])

  /*
   * El pitido SE PROGRAMA al empezar el descanso, no se dispara al cumplirse.
   *
   * Es la diferencia entre avisar y avisar A TIEMPO. Disparado desde el efecto
   * de arriba llegaría cuando el navegador se digne repintar, que con la pestaña
   * en segundo plano puede ser un minuto tarde; y la pestaña en segundo plano es
   * exactamente el caso para el que se puso el sonido. Programado por adelantado
   * suena en su instante, porque el reloj de audio no se estrangula.
   *
   * NO DEPENDE DE `phaseSeconds`, y no es un descuido: cambia cada segundo y
   * volvería a programar el aviso en cada tic. Lo que hace falta es el instante
   * en que empezó el descanso, que sólo cambia cuando el descanso cambia. De ahí
   * que las dependencias sean el ancla y lo acumulado, y no los segundos.
   *
   * La limpieza cancela, y con eso quedan cubiertos los tres modos de que un
   * descanso deje de existir: empezar la siguiente serie antes de tiempo,
   * deshacer, y pausar —al pausar, `state` deja de ser `running` y el efecto se
   * desmonta; al reanudar se vuelve a anclar el reloj y se reprograma con lo que
   * quede—. Un pitido a destiempo enseña a desconfiar del aviso.
   */
  useEffect(() => {
    if (!soundEnabled || state !== 'running' || phase !== 'rest' || currentStep === null) return

    const alreadyRested = phaseAccumulated + Math.floor((Date.now() - phaseStartedAt) / 1000)
    scheduleRestChime(currentStep.restSecondsAfter - alreadyRested)

    return cancelRestChime
  }, [soundEnabled, state, phase, currentStep, phaseAccumulated, phaseStartedAt])

  const markReps = useCallback((count: number) => {
    // Volver a tocar la ultima marcada la desmarca: es como se corrige una
    // repeticion de mas sin tener que empezar de cero.
    setRepsDone((previous) => (previous === count ? count - 1 : count))
  }, [])

  const setWeight = useCallback((kilos: number | null) => setChosenWeight(kilos), [])



  /**
   * El peso con el que arranca una serie, en tres escalones.
   *
   * 1. LO HECHO HOY en ese ejercicio. Es lo que hay puesto en la barra ahora
   *    mismo, así que gana a todo lo demás. Del ejercicio y no de la serie
   *    anterior, que en una superserie es otro ejercicio con otra carga.
   * 2. LA ÚLTIMA SESIÓN. A «¿cuánto pongo?» responde lo mismo que la anterior, y
   *    teclearlo otra vez es lo que hace que se deje de anotar.
   * 3. LO PRESCRITO en la rutina, si el entrenador puso una carga de referencia.
   *
   * EL HISTORIAL VA POR DELANTE DE LA PRESCRIPCIÓN, y es la decisión que
   * importa de las tres. Al revés, una rutina escrita hace tres meses bajaría a
   * alguien de 80 a 60 cada vez que la abriera, en silencio y sin que nadie
   * hubiera decidido bajarla. Así la prescripción hace lo que sí sabe hacer:
   * contestar el primer día, cuando no hay historial que contradecir. Lo
   * prescrito se sigue viendo siempre —en la línea de la serie y bajo el
   * campo—, así que una descarga deliberada se puede seguir a mano.
   */
  const carriedWeight = useCallback(
    (step: SetStep, done: SetRecord[]): number | null => {
      for (let index = done.length - 1; index >= 0; index -= 1) {
        const record = done[index]
        if (record.exerciseId === step.exerciseId && record.weightKg !== undefined) {
          return record.weightKg
        }
      }

      return lastWeights.get(step.exerciseId) ?? step.weightKg ?? null
    },
    [lastWeights]
  )

  /*
   * El peso de la serie en curso: lo decidido a mano si lo hay, y si no el que
   * viene arrastrado.
   *
   * SE DERIVA, NO SE COPIA A UN ESTADO. La versión anterior lo copiaba con un
   * efecto para poder rellenarlo cuando `useLastWeights` resolvía —es una
   * consulta y llega después del primer pintado—, y ese efecto pisaba el peso
   * restaurado al deshacer una serie: volvía a la primera, la guarda del efecto
   * se cumplía otra vez y lo borraba. Derivándolo no hay dos fuentes que
   * competir.
   */
  const weightKg =
    chosenWeight !== undefined
      ? chosenWeight
      : currentStep === null
        ? null
        : carriedWeight(currentStep, records)

  const adjustWeight = useCallback(
    (delta: number) => {
      // Desde «sin anotar» el primer toque deja el propio incremento, no cero:
      // pulsar «+2,5» sin haber puesto nada quiere decir 2,5.
      setChosenWeight(Math.max((weightKg ?? 0) + delta, 0))
    },
    [weightKg]
  )

  const advance = useCallback(() => {
    const next = currentIndex + 1
    setCurrentIndex(next)
    setPhase(next >= steps.length ? 'done' : 'work')
    setRepsDone(0)
    restartPhaseClock()
    // A «sin decidir»: el peso de la serie nueva lo pone el arrastre.
    setChosenWeight(undefined)
  }, [currentIndex, restartPhaseClock, steps.length])

  const finishSet = useCallback(() => {
    if (currentStep === null || phase !== 'work') return

    /*
     * Aquí se desbloquea el audio, y tiene que ser aquí.
     *
     * Los navegadores sólo reanudan un contexto de audio dentro del manejador
     * de un gesto del usuario. Cerrar la serie es el gesto que SIEMPRE precede a
     * un descanso —no hay descanso que no venga de este toque—, así que cuando
     * el temporizador quiera avisar, el audio ya está corriendo. Pedirlo desde
     * el temporizador llegaría tarde y no sonaría nada.
     */
    if (soundEnabled) primeRestChime()

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
        workSeconds: secondsOf(phaseStartedAt, phaseAccumulated, Date.now()),
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
      advance()
      return
    }

    setPhase('rest')
    restartPhaseClock()
  }, [
    advance,
    currentIndex,
    currentStep,
    phaseAccumulated,
    phaseStartedAt,
    restartPhaseClock,
    secondsOf,
    phase,
    records,
    repsDone,
    soundEnabled,
    steps.length,
    weightKg,
  ])

  const startNextSet = useCallback(() => {
    if (phase !== 'rest') return

    // El descanso REAL se anota en la serie que lo provoco, no en la siguiente:
    // es una propiedad de como se ejecuto esa serie.
    const taken = secondsOf(phaseStartedAt, phaseAccumulated, Date.now())
    const rested = records.map((record, index) =>
      index === records.length - 1 ? { ...record, restSeconds: taken } : record
    )

    setRecords(rested)
    advance()
  }, [advance, phase, phaseAccumulated, phaseStartedAt, records, secondsOf])

  const undoLastSet = useCallback(() => {
    const last = records[records.length - 1]
    if (last === undefined) return

    const stepIndex = steps.findIndex((step) => step.id === last.stepId)
    if (stepIndex === -1) return

    setRecords(records.slice(0, -1))
    setCurrentIndex(stepIndex)
    setPhase('work')
    setRepsDone(last.repsDone)
    setChosenWeight(last.weightKg ?? null)
    /*
     * El reloj vuelve a donde estaba, no a cero: la serie se hizo y duró eso.
     * Reiniciarlo convertiría el arreglo de un error de conteo en un dato falso.
     */
    restartPhaseClock(last.workSeconds)
  }, [records, restartPhaseClock, steps])

  /*
   * Pausar CONGELA lo corrido; reanudar vuelve a anclar los dos relojes. Sin
   * esto, el rato en pausa se contaría igual y una pausa de diez minutos daría
   * una serie de diez minutos.
   */
  const pause = useCallback(() => {
    setSessionAccumulated(elapsedSeconds)
    setPhaseAccumulated(phaseSeconds)
    setState('paused')
  }, [elapsedSeconds, phaseSeconds])

  const resume = useCallback(() => {
    const anchor = Date.now()
    setSessionStartedAt(anchor)
    setPhaseStartedAt(anchor)
    setNow(anchor)
    setState('running')
  }, [])

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
    undoLastSet,
    pause,
    resume,
  }
}
