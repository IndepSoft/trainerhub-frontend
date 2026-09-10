/**
 * Lo que el servidor escribe al cerrar una sesión: su puntuación y las
 * insignias que desbloqueó.
 *
 * SON ENTIDADES LEÍDAS, NUNCA ESCRITAS DESDE AQUÍ. La regla vive en la base
 * —`score_session`, `evaluate_badges`— y corre por disparador en la misma
 * transacción que cierra la sesión; el cliente pinta lo que llega. Un cliente
 * modificado no se puntúa a sí mismo, y cambiar la fórmula no reescribe la
 * historia: cada puntuación lleva la versión de la regla con la que se calculó.
 */

/** La versión de la regla de puntuación que aplica el servidor hoy. */
export const SCORE_RULE_VERSION = 1

/**
 * La puntuación de una sesión, con su desglose.
 *
 *   puntos = base × adherencia × progreso × cohorte
 *
 * Se guardan los cuatro factores además de los puntos para que la celebración
 * pueda explicar de dónde salen, y para poder repuntuar a propósito.
 */
export interface SessionScore {
  sessionId: string
  studentId: string
  crewId: string
  /** El día en que se entrenó, `result.completedAt`. Es lo que ordena todo. */
  completedOn: string
  base: number
  /** Hecho sobre previsto, acotado a [0,8 – 1,1]: pasarse del plan no suma. */
  adherence: number
  /** 1,00 sin referencia; hasta 1,15 si todos los ejercicios mejoraron carga. */
  progress: number
  /** Por edad y nivel. 1,00 sin fecha de nacimiento: no se supone nada. */
  cohort: number
  points: number
  ruleVersion: number
}

export type BadgeRarity = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'mythic'

export type BadgeCategory = 'streak' | 'performance' | 'technique' | 'longevity' | 'community'

/** El orden de las rarezas, de la más común a la más rara. */
export const BADGE_RARITIES: BadgeRarity[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'mythic']

export const BADGE_CATEGORIES: BadgeCategory[] = [
  'streak',
  'performance',
  'technique',
  'longevity',
  'community',
]

/**
 * Una insignia conseguida.
 *
 * `sessionId` es la sesión que la desbloqueó, y es lo que hace que la
 * celebración sepa qué es NUEVO. Platino y Diamante nacen con `validatedAt` a
 * `null` y las confirma quien gestiona alumnos.
 */
export interface StudentBadge {
  studentId: string
  code: string
  unlockedOn: string
  sessionId: string | null
  validatedAt: string | null
}
