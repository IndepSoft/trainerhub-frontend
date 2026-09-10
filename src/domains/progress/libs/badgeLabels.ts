import type { BadgeRarity } from '@/shared/domain/entities/progress'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

/** Cómo se llama cada rareza. Aparte de la placa: la galería también lo pinta. */
export const RARITY_LABEL_KEY: Record<BadgeRarity, TranslationKey> = {
  bronze: 'badge.rarity.bronze',
  silver: 'badge.rarity.silver',
  gold: 'badge.rarity.gold',
  platinum: 'badge.rarity.platinum',
  diamond: 'badge.rarity.diamond',
  mythic: 'badge.rarity.mythic',
}
