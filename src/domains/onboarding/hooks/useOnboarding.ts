import { useCallback, useState } from 'react'
import { readFlag, writeFlag } from '@/shared/lib/localPreferences'
import { onboardingSteps, ONBOARDING_SEEN_KEY } from '../data/onboardingSteps.mock'
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
  /** Marca el onboarding como visto. Idempotente. */
  complete: () => void
}

/**
 * Estado del onboarding.
 *
 * La marca de «ya visto» se guarda en las preferencias del dispositivo. Es la
 * costura: cuando exista backend, pasará a vivir en el perfil del entrenador y
 * sólo cambia `complete`, porque el resto de la aplicación no sabe de dónde
 * sale el dato.
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

  const complete = useCallback(() => writeFlag(ONBOARDING_SEEN_KEY, true), [])

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

/** ¿Ya se vio el onboarding en este dispositivo? */
export function hasSeenOnboarding(): boolean {
  return readFlag(ONBOARDING_SEEN_KEY)
}
