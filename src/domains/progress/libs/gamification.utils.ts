import type { LevelProgress } from '../types/gamification.types'

/**
 * Cálculos del registro de gamificación. Puros: entran datos, salen números.
 */

/** Fracción de 0 a 1 del nivel en curso. */
export function calculateLevelCompletion(level: LevelProgress): number {
  if (level.experienceForNextLevel <= 0) return 0
  const ratio = level.currentExperience / level.experienceForNextLevel
  return Math.min(Math.max(ratio, 0), 1)
}

export function experienceRemaining(level: LevelProgress): number {
  return Math.max(level.experienceForNextLevel - level.currentExperience, 0)
}
