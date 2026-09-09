import type { OnboardingRepository } from '@/shared/domain/ports/OnboardingRepository'
import { readFlag, writeFlag } from '@/shared/lib/localPreferences'

/**
 * La clave del dispositivo. Es la misma que la suite de interfaz escribe para
 * saltarse el recorrido, y por eso no cambia: la simulacion tiene que dar lo
 * mismo que daba.
 */
export const ONBOARDING_SEEN_KEY = 'trainerhub.onboarding.visto'

/**
 * Onboarding simulado: la marca vive en el dispositivo, como antes.
 *
 * Es una simulacion honesta del puerto y no una copia del real: sin cuenta de
 * verdad no hay donde guardar «esta persona ya lo vio» mas que en el navegador
 * que la tiene abierta.
 */
export class FakeOnboardingRepository implements OnboardingRepository {
  async hasSeen(): Promise<boolean> {
    return readFlag(ONBOARDING_SEEN_KEY)
  }

  async markSeen(): Promise<void> {
    writeFlag(ONBOARDING_SEEN_KEY, true)
  }
}
