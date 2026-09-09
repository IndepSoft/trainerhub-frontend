import { useCallback, useEffect, useRef, useState } from 'react'
import { container } from '@/app/container'
import { onboardingSteps } from '../data/onboardingSteps.mock'
import type { OnboardingStep } from '../types/onboarding.types'

interface UseOnboardingResult {
  steps: OnboardingStep[]
  currentIndex: number
  currentStep: OnboardingStep
  isFirstStep: boolean
  isLastStep: boolean
  goToNext: () => void
  goToPrevious: () => void
  goToIndex: (index: number) => void
  /** Marca el onboarding como visto para la cuenta. Idempotente. */
  complete: () => Promise<void>
}

/**
 * Estado del onboarding.
 *
 * La marca de «ya visto» va por el puerto: en la cuenta con Supabase, en el
 * dispositivo en la simulación. Era la costura anunciada, y cambió sólo
 * `complete`: el resto de la aplicación no sabe de dónde sale el dato.
 */
export function useOnboarding(): UseOnboardingResult {
  const [currentIndex, setCurrentIndex] = useState(0)

  const lastIndex = onboardingSteps.length - 1

  const goToIndex = useCallback(
    (index: number) => {
      // Se acota en vez de dejar que el indice se salga: un deslizamiento en el
      // ultimo paso no debe pintar una vista vacia.
      setCurrentIndex(Math.min(Math.max(index, 0), lastIndex))
    },
    [lastIndex]
  )

  const goToNext = useCallback(() => goToIndex(currentIndex + 1), [currentIndex, goToIndex])
  const goToPrevious = useCallback(() => goToIndex(currentIndex - 1), [currentIndex, goToIndex])

  const complete = useCallback(() => container.onboarding.markSeen(), [])

  return {
    steps: onboardingSteps,
    currentIndex,
    currentStep: onboardingSteps[currentIndex],
    isFirstStep: currentIndex === 0,
    isLastStep: currentIndex === lastIndex,
    goToNext,
    goToPrevious,
    goToIndex,
    complete,
  }
}

/**
 * Si quien ha entrado ya vio el onboarding. `null` mientras se pregunta.
 *
 * El `null` importa: la guardia del layout no puede decidir «no lo vio» antes
 * de tener respuesta, porque mandaría al recorrido a quien ya lo terminó
 * durante el instante que tarda en llegar. Un fallo al preguntar cuenta como
 * «visto»: mejor no repetir la bienvenida que bloquear la aplicación.
 */
export function useOnboardingSeen(userId: string | undefined, refreshKey: string): boolean | null {
  /*
   * La respuesta va ATADA A LA RUTA para la que se pregunto. Sin eso, el primer
   * render tras terminar el recorrido leia el `false` de la ruta anterior
   * -el efecto que vuelve a preguntar corre despues del render- y la guardia
   * devolvia al onboarding a quien lo acababa de completar. Una respuesta de
   * otra ruta es «todavia no se».
   */
  const [answer, setAnswer] = useState<{ key: string; seen: boolean } | null>(null)
  // Una vez visto, visto: nadie deja de haberlo visto, y contra la base eso
  // es una consulta por sesion y no una por pantalla.
  const settled = useRef(false)

  useEffect(() => {
    if (userId === undefined) {
      settled.current = false
      setAnswer(null)
      return
    }
    if (settled.current) return

    let active = true
    container.onboarding
      .hasSeen()
      .then((seen) => {
        if (!active) return
        if (seen) settled.current = true
        setAnswer({ key: refreshKey, seen })
      })
      .catch(() => {
        if (active) setAnswer({ key: refreshKey, seen: true })
      })

    return () => {
      active = false
    }
  }, [userId, refreshKey])

  if (userId === undefined) return null
  if (settled.current) return true
  return answer !== null && answer.key === refreshKey ? answer.seen : null
}
