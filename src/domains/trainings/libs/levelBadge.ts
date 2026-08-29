import type { TrainingLevel } from '../types/training.types'

/**
 * Presentación de cada nivel de rutina.
 *
 * Mismos valores que en `students`: es la misma escala de dificultad y debe
 * verse igual en los dos dominios. Antes no coincidían —«Principiante» era
 * amarillo aquí y naranja allí— porque cada tabla vivía dentro de su componente.
 */
export const LEVEL_BADGE: Record<TrainingLevel, string> = {
  Principiante: 'border-scale-1/50 text-scale-1',
  Intermedio: 'border-scale-2/50 text-scale-2',
  Avanzado: 'border-scale-3/50 text-scale-3',
}
