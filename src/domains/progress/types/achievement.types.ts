import type { BadgeCategory, BadgeRarity } from '@/shared/domain/entities/progress'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

export type BadgeIcon =
  | 'trophy'
  | 'star'
  | 'target'
  | 'flame'
  | 'award'
  | 'medal'
  | 'dumbbell'
  | 'timer'
  | 'heart'
  | 'shield'
  | 'sunrise'
  | 'calendar'

/**
 * Una insignia tal y como se PRESENTA: nombre, icono, rareza, categoría.
 *
 * LA REGLA NO ESTÁ AQUÍ. Vive en la base —`evaluate_badges`— y corre al cerrar
 * cada sesión; este catálogo sólo sabe cómo se llama cada código y con qué
 * placa se pinta. Una prueba de contrato compara los códigos de aquí con los
 * de `badge_definitions`, así que una insignia que el servidor no conozca no
 * compila en silencio: falla la CI.
 */
export interface BadgeDefinition {
  code: string
  /*
   * SON CLAVES, no textos: el catalogo es una constante de modulo, se evalua al
   * importar y ahi todavia no hay idioma que consultar. Traduce quien pinta.
   */
  nameKey: TranslationKey
  descriptionKey: TranslationKey
  icon: BadgeIcon
  category: BadgeCategory
  rarity: BadgeRarity
  /** Platino y Diamante: nacen pendientes y las confirma el entrenador. */
  requiresValidation: boolean
}

/**
 * Una insignia del catálogo, cruzada con lo que este alumno ha conseguido.
 *
 * `unlockedAt` viene del servidor —la sesión que la desbloqueó—, no de repasar
 * la historia. Sin fecha significa que aún no se ha conseguido.
 */
export interface Achievement extends BadgeDefinition {
  unlockedAt?: Date
  /** Conseguida y a la espera de que el entrenador la confirme. */
  pendingValidation: boolean
}
