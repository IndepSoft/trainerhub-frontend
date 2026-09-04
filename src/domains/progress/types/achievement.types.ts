import type { Session } from '@/shared/domain/entities/session'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

export type AchievementCategory = 'attendance' | 'consistency' | 'metrics' | 'challenges'

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

/**
 * Un logro tal y como se define: lo que es, y CUÁNDO se consigue.
 *
 * La condición es una función y no una frase. Antes la definición traía una
 * fecha de desbloqueo escrita a mano junto a una descripción en prosa, así que
 * el catálogo afirmaba cosas que nada comprobaba.
 *
 * Recibe las sesiones del alumno y la fecha en la que se evalúa, porque muchas
 * condiciones son «a día de hoy» —una racha de siete— y no acumulativas.
 */
export interface AchievementDefinition {
  id: string
  /*
   * SON CLAVES, no textos: el catalogo es una constante de modulo, se evalua al
   * importar y ahi todavia no hay idioma que consultar. Traduce quien pinta.
   */
  nameKey: TranslationKey
  descriptionKey: TranslationKey
  icon: string
  category: AchievementCategory
  rarity: AchievementRarity
  pointsReward: number
  condition: (sessions: Session[], asOf: Date) => boolean
}

/**
 * Un logro ya evaluado contra un historial concreto.
 *
 * `unlockedAt` es DERIVADO: sale de repasar el historial, no del catálogo. Sin
 * fecha significa que aún no se ha conseguido.
 */
export interface Achievement extends AchievementDefinition {
  unlockedAt?: Date
}
