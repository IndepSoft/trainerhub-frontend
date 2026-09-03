import { SECONDS_PER_REP } from '@/shared/domain/routineMetrics'
import { maxReps, type SetStep } from './setPlan'

/**
 * Cómo salió una serie frente a lo que estaba prescrito. Funciones puras.
 *
 * SÓLO SE CONTRASTA CONTRA LO QUE DE VERDAD ESTÁ DEFINIDO: las repeticiones
 * prescritas, el descanso prescrito y, cuando lo hay, la cadencia. Nada de
 * inventar un objetivo donde la prescripción no lo pone —un veredicto sobre un
 * número que nadie fijó no evalúa nada, sólo lo aparenta—.
 */

/** El rango prescrito. Una cifra suelta es un rango de un solo valor. */
export interface RepRange {
  min: number
  max: number
}

export function parseRepRange(reps: string): RepRange {
  const numbers = reps.match(/\d+/g)
  if (numbers === null) return { min: 0, max: 0 }

  const values = numbers.map(Number)
  return { min: Math.min(...values), max: Math.max(...values) }
}

export type RepsVerdict = 'below' | 'within' | 'above'

/** Si las repeticiones hechas caen dentro del rango, por debajo o por encima. */
export function repsVerdict(done: number, reps: string): RepsVerdict {
  const range = parseRepRange(reps)
  if (done < range.min) return 'below'
  if (done > range.max) return 'above'
  return 'within'
}

/**
 * Margen que se considera «lo pactado» en el descanso.
 *
 * Quince segundos: por debajo de eso la diferencia es ruido de cronómetro
 * —guardar el móvil, colocar la barra— y señalarla convertiría el veredicto en
 * un reproche constante que se deja de leer.
 */
export const REST_TOLERANCE_SECONDS = 15

export type RestVerdict = 'short' | 'onTarget' | 'long'

export function restVerdict(actualSeconds: number, prescribedSeconds: number): RestVerdict {
  const difference = actualSeconds - prescribedSeconds
  if (difference < -REST_TOLERANCE_SECONDS) return 'short'
  if (difference > REST_TOLERANCE_SECONDS) return 'long'
  return 'onTarget'
}

/**
 * Suma de la cadencia «3-1-1-0» en segundos: lo que tarda UNA repetición.
 *
 * Devuelve `null` cuando no hay cadencia escrita, y eso es lo que evita
 * inventarse un objetivo: sin cadencia se cae a la estimación declarada del
 * proyecto, que ya existe y ya está marcada como supuesto.
 */
export function tempoSeconds(tempo: string | undefined): number | null {
  if (tempo === undefined) return null

  const numbers = tempo.match(/\d+/g)
  if (numbers === null) return null

  return numbers.map(Number).reduce((total, value) => total + value, 0)
}

/**
 * Cuánto se espera que dure el trabajo de una serie.
 *
 * Con cadencia prescrita es una cuenta: repeticiones por el tiempo de una. Sin
 * ella se usa `SECONDS_PER_REP`, la estimación que el proyecto ya declara para
 * calcular la duración de una rutina —tres segundos por repetición—. Usar la
 * misma constante es lo que evita que la sesión y la ficha de la rutina digan
 * cosas distintas sobre el mismo ejercicio.
 */
export function expectedWorkSeconds(step: SetStep): number {
  const perRep = tempoSeconds(step.tempo) ?? SECONDS_PER_REP
  return maxReps(step.reps) * perRep
}

/**
 * Margen del ritmo de trabajo, en tanto por uno.
 *
 * Más ancho que el del descanso —un 40 %— porque la referencia es más blanda:
 * sin cadencia prescrita se compara contra una estimación, y estrechar el margen
 * sobre un supuesto produce veredictos que suenan a medición.
 */
export const PACE_TOLERANCE = 0.4

export type PaceVerdict = 'fast' | 'onTarget' | 'slow'

export function paceVerdict(actualSeconds: number, expectedSeconds: number): PaceVerdict {
  if (expectedSeconds === 0) return 'onTarget'

  const ratio = actualSeconds / expectedSeconds
  if (ratio < 1 - PACE_TOLERANCE) return 'fast'
  if (ratio > 1 + PACE_TOLERANCE) return 'slow'
  return 'onTarget'
}
