import type { LevelProgress, Milestone } from '../types/gamification.types'

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

/** Fracción de 0 a 1 de un hito. */
export function calculateMilestoneCompletion(milestone: Milestone): number {
  if (milestone.requiredSessions <= 0) return 0
  const ratio = milestone.completedSessions / milestone.requiredSessions
  return Math.min(Math.max(ratio, 0), 1)
}

/**
 * Índice del hito activo, o -1 si no hay ninguno.
 *
 * Sirve para desplazar el sendero hasta donde está el usuario al abrir la
 * pantalla, en vez de dejarlo siempre arriba del todo.
 */
export function findActiveMilestoneIndex(milestones: Milestone[]): number {
  return milestones.findIndex((milestone) => milestone.state === 'active')
}
