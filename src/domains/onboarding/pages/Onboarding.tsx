import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { HapticPattern, vibrate } from '@/shared/lib/haptics'
import { useOnboarding } from '../hooks/useOnboarding'
import { OnboardingSlide } from '../components/OnboardingSlide'
import { OnboardingProgress } from '../components/OnboardingProgress'

/**
 * Onboarding. Sólo composición: el estado está en `useOnboarding` y el gesto en
 * `useSwipe`.
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const {
    steps,
    currentIndex,
    currentStep,
    isLastStep,
    goToNext,
    goToPrevious,
    goToIndex,
    complete,
  } = useOnboarding()

  const finish = () => {
    complete()
    navigate('/dashboard', { replace: true })
  }

  const advance = () => {
    if (isLastStep) {
      finish()
      return
    }
    // El resultado se ignora: en iOS no hay Vibration API y el avance debe
    // funcionar igual. Ver shared/lib/haptics.
    vibrate(HapticPattern.TAP)
    goToNext()
  }

  const { handlers } = useSwipe({
    onSwipeLeft: () => !isLastStep && goToNext(),
    onSwipeRight: goToPrevious,
  })

  return (
    <div className="flex flex-1 flex-col bg-ink" {...handlers}>
      <header className="mx-auto flex w-full max-w-3xl shrink-0 items-center justify-between px-6 pt-6">
        <span className="font-display text-lg font-extrabold uppercase tracking-tight text-white">
          TrainerHub
        </span>

        {/* «Saltar» tambien marca el onboarding como visto: si no, reaparece en
            cada carga y quien lo salto lo hizo justamente para no verlo. */}
        {!isLastStep && (
          <button
            type="button"
            onClick={finish}
            className="-mr-2 flex h-11 items-center px-2 text-sm font-semibold uppercase tracking-wider text-white/50"
          >
            Saltar
          </button>
        )}
      </header>

      <OnboardingSlide step={currentStep} mirrored={currentIndex % 2 === 1} />

      <div
        className="mx-auto w-full max-w-3xl shrink-0 space-y-5 px-6 pb-8"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <OnboardingProgress
          total={steps.length}
          currentIndex={currentIndex}
          onSelect={goToIndex}
        />

        <button
          type="button"
          onClick={advance}
          className="flex w-full items-center justify-center gap-3 bg-white py-5 font-display text-lg font-extrabold uppercase tracking-[0.2em] text-ink transition-transform active:scale-[0.98]"
        >
          {isLastStep ? 'Empezar' : 'Siguiente'}
          <ArrowRight className="size-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
