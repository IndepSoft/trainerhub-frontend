import { predefinedAchievements } from '../data/predefinedAchievements'
import { gamificationProfileMock } from '../data/gamification.mock'
import { findLatestUnlocked } from '../libs/gamification.utils'
import type { Achievement } from '../types/achievement.types'

interface UseLatestAchievementResult {
  achievement: Achievement | null
  /** Cifra protagonista de la celebración y su etiqueta. */
  headlineValue: number
  headlineLabel: string
}

/**
 * Qué se celebra ahora mismo.
 *
 * La cifra protagonista es la racha y no los puntos del logro: es el dato que el
 * usuario reconoce como suyo, y el que el registro agresivo debe gritar. Los
 * puntos van en letra pequeña, como recompensa.
 */
export function useLatestAchievement(): UseLatestAchievementResult {
  const achievement = findLatestUnlocked(predefinedAchievements)

  return {
    achievement,
    headlineValue: gamificationProfileMock.streak.currentDays,
    headlineLabel: 'días seguidos',
  }
}
