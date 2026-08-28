/**
 * Entidades del registro de gamificación.
 *
 * Se separan de `progress.types` a propósito: aquello describe el resumen que
 * ve el entrenador; esto describe el juego —racha, nivel, hitos—, que es un
 * concepto distinto con su propio ciclo de vida.
 */

export interface StreakStatus {
  currentDays: number
  bestDays: number
  /** Si hoy ya cuenta, la racha no está en riesgo de romperse esta noche. */
  completedToday: boolean
}

/**
 * Nivel y experiencia.
 *
 * Se guardan la experiencia actual y la que exige el nivel siguiente, no un
 * porcentaje: el porcentaje se deriva en `gamification.utils`. Almacenar ambos
 * permitiría que discrepasen.
 */
export interface LevelProgress {
  level: number
  currentExperience: number
  experienceForNextLevel: number
}

export type MilestoneState = 'completed' | 'active' | 'locked'

export interface Milestone {
  id: string
  title: string
  description: string
  state: MilestoneState
  /** Sesiones hechas y exigidas. La fracción se deriva, no se almacena. */
  completedSessions: number
  requiredSessions: number
  experienceReward: number
}

export interface GamificationProfile {
  streak: StreakStatus
  level: LevelProgress
  milestones: Milestone[]
}
