import { gamificationProfileMock } from '../data/gamification.mock'
import { calculateLevelCompletion, experienceRemaining } from '../libs/gamification.utils'
import type { GamificationProfile } from '../types/gamification.types'

interface UseGamificationProfileResult {
  profile: GamificationProfile
  /** Fracción de 0 a 1 del nivel en curso. Derivada, nunca almacenada. */
  levelCompletion: number
  experienceToNextLevel: number
  loading: boolean
  error: string | null
}

/**
 * Única fuente del perfil de juego.
 *
 * Misma costura que el resto de dominios: cuando llegue el backend, este hook
 * pasará a llamar al puerto vía `container` y ni la página ni los componentes se
 * enterarán. Los cálculos se delegan en `gamification.utils`, que es puro.
 */
export function useGamificationProfile(): UseGamificationProfileResult {
  const profile = gamificationProfileMock

  return {
    profile,
    levelCompletion: calculateLevelCompletion(profile.level),
    experienceToNextLevel: experienceRemaining(profile.level),
    loading: false,
    error: null,
  }
}
