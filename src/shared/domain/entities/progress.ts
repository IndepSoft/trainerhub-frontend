import { ageOf } from './student'

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
  /**
   * Marcada por un salto de carga: más de un 20 % sobre la mediana de cuatro
   * semanas en algún ejercicio. El progreso se queda en 1,00 hasta que el
   * entrenador la revise; si la acepta, se repuntúa confiando en la carga.
   */
  flaggedReason: 'load_jump' | null
  reviewedAt: string | null
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
/** Las que nacen pendientes de que el entrenador las confirme. */
export const BADGES_REQUIRING_VALIDATION: string[] = ['legend', 'persistence']

export interface StudentBadge {
  studentId: string
  code: string
  unlockedOn: string
  sessionId: string | null
  validatedAt: string | null
}

/**
 * Las cinco rutas de desarrollo. Catálogo de sistema: se siembra y no cambia.
 *
 * La ruta de un alumno SE DERIVA del objetivo de su último plan asignado
 * —`ROUTE_BY_OBJECTIVE`— y el entrenador puede cambiarla a mano. Apex no
 * tiene objetivo que la active: es siempre elección del entrenador.
 */
export type ProgressRouteCode = 'titan' | 'endurance' | 'apex' | 'vitality' | 'hybrid'

export const PROGRESS_ROUTES: ProgressRouteCode[] = ['titan', 'endurance', 'apex', 'vitality', 'hybrid']

export function isProgressRouteCode(value: string): value is ProgressRouteCode {
  return (PROGRESS_ROUTES as string[]).includes(value)
}

export const ROUTE_BY_OBJECTIVE: Record<string, ProgressRouteCode> = {
  hipertrofia: 'titan',
  'fuerza-maxima': 'titan',
  'resistencia-muscular': 'endurance',
  'perdida-grasa': 'vitality',
  acondicionamiento: 'vitality',
}

/**
 * Los cuatro nodos de toda ruta. El 1 es donde nace todo el mundo; a partir
 * del 2 hacen falta puntos acumulados en la ruta, semanas seguidas de
 * adherencia, y que el entrenador valide el hito. Espejo de `route_nodes`;
 * una prueba de contrato compara los dos.
 */
export interface RouteNode {
  position: number
  pointsRequired: number
  weeksRequired: number
}

export const ROUTE_NODES: RouteNode[] = [
  { position: 1, pointsRequired: 0, weeksRequired: 0 },
  { position: 2, pointsRequired: 300, weeksRequired: 4 },
  { position: 3, pointsRequired: 1200, weeksRequired: 6 },
  { position: 4, pointsRequired: 3000, weeksRequired: 8 },
]

/** El umbral de adherencia semanal que cuenta como semana cumplida. */
export const ADHERENCE_THRESHOLD = 0.85

/** Dónde está un alumno en su ruta. Calculado en el servidor, nunca guardado. */
export interface RouteProgress {
  studentId: string
  routeCode: ProgressRouteCode
  /** El nodo en el que está, de 1 a 4. */
  position: number
  /** Puntos acumulados desde que entró en la ruta. */
  points: number
  /** Semanas seguidas con adherencia de al menos el 85 %, terminando en ésta. */
  adherentWeeks: number
  /** Nodos que el entrenador ya validó. */
  validatedPositions: number[]
}

/**
 * La cohorte, con nombre y sin edad: es lo único que sale al ranking.
 *
 *   youth < 18 · adult 18–45 · senior > 45 · null sin fecha
 *
 * Espejo de `cohort_of` en SQL. La fecha de nacimiento sólo la leen el
 * propio alumno y el equipo técnico; el nombre de la cohorte lo ve el ranking
 * para comparar entre iguales.
 */
export type Cohort = 'youth' | 'adult' | 'senior'

export function cohortOf(birthDate: string | null, today: Date = new Date()): Cohort | null {
  const age = ageOf(birthDate, today)
  if (age === null) return null
  if (age < 18) return 'youth'
  if (age > 45) return 'senior'
  return 'adult'
}

/**
 * Una pausa de la racha: los días entre `fromDay` y `toDay`, ambos incluidos,
 * no la rompen. Lesión y viaje las escribe quien gestiona; el comodín, el
 * propio alumno, y cubre un solo día.
 */
export type StreakPauseReason = 'injury' | 'travel' | 'wildcard'

export interface StreakPause {
  studentId: string
  fromDay: string
  toDay: string
  reason: StreakPauseReason
}

/** Un comodín por cada ocho semanas seguidas entrenando, hasta dos acumulados. */
export const WILDCARD_WEEKS = 8
export const WILDCARD_CAP = 2
/** Los comodines gastados en las últimas dieciséis semanas se descuentan. */
export const WILDCARD_WINDOW_DAYS = 112
