import type { StreakStatus } from '../types/streak.types'

export type FlameIntensity = 'starter' | 'common' | 'rare' | 'epic' | 'legendary'

export interface FlamePresentation {
  intensity: FlameIntensity
  /** Clase de color. */
  color: string
  /** Clase de tamaño. */
  size: string
}

/**
 * Intensidad de la llama según los días de racha.
 *
 * La rampa es de un solo tono: la llama arde más a medida que la racha crece, y
 * eso se expresa con opacidad y tamaño, no cambiando de color. Antes recorría
 * gris → naranja → rojo → naranja → amarillo, que no es una progresión sino
 * cinco colores sueltos, y ademas ninguno pertenecia al sistema.
 *
 * Ember es el color de la racha en toda la aplicación —lo es también en la
 * cabecera de gamificación—, así que la llama no puede ser de otro color sin
 * romper esa asociación.
 */
export function getFlameIntensity(streak: number): FlamePresentation {
  if (streak >= 100) return { intensity: 'legendary', color: 'text-ember', size: 'h-8 w-8' }
  if (streak >= 50) return { intensity: 'epic', color: 'text-ember/85', size: 'h-7 w-7' }
  if (streak >= 21) return { intensity: 'rare', color: 'text-ember/70', size: 'h-6 w-6' }
  if (streak >= 7) return { intensity: 'common', color: 'text-ember/55', size: 'h-5 w-5' }
  // Una racha que acaba de empezar se muestra apagada: es la señal de que aún
  // no ha prendido, y de que hay algo que mantener.
  return { intensity: 'starter', color: 'text-ink/30', size: 'h-4 w-4' }
}

/**
 * Color del indicador de riesgo.
 *
 * Semántico, no de marca: describe un hecho —la racha está sana, en riesgo o
 * rota—, y por eso usa los tokens de estado y no Cobalt ni Ember.
 */
export function getRiskColor(status: StreakStatus, riskLevel: number): string {
  if (status === 'broken') return 'text-ink/40'
  if (status === 'at_risk') return riskLevel <= 6 ? 'text-danger' : 'text-warning'
  return 'text-success'
}
