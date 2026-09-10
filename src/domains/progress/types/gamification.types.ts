/**
 * Entidades del registro de gamificación.
 *
 * Se separan de `progress.types` a propósito: aquello describe el resumen que
 * ve el entrenador; esto describe el juego —racha, nivel, sendero—, que es un
 * concepto distinto con su propio ciclo de vida.
 */

import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

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

export type PathNodeState = 'completed' | 'active' | 'locked'

/**
 * Un nodo del sendero, YA CRUZADO con dónde está el alumno.
 *
 * ERA UNA ESCALERA FIJA DE SESIONES —tres, siete, doce…— igual para todo el
 * mundo. Ahora es la ruta de desarrollo: cuatro nodos que se abren con puntos,
 * semanas de adherencia y la validación del entrenador, y que dependen del
 * objetivo del plan. Las cifras vienen del servidor; aquí sólo se pintan.
 */
export interface PathNode {
  position: number
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  state: PathNodeState
  points: { current: number; target: number }
  weeks: { current: number; target: number }
  /** Si el entrenador ya validó este hito. El nodo 1 no lo necesita. */
  validated: boolean
  needsValidation: boolean
}

export interface GamificationProfile {
  streak: StreakStatus
  level: LevelProgress
}
