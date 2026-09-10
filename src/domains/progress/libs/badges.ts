import type { Achievement } from '../types/achievement.types'

/** Sólo las conseguidas, de la más reciente a la más antigua. */
export function unlockedAchievements(achievements: Achievement[]): Achievement[] {
  return achievements
    .filter((achievement): achievement is Achievement & { unlockedAt: Date } =>
      achievement.unlockedAt instanceof Date
    )
    .sort((left, right) => right.unlockedAt.getTime() - left.unlockedAt.getTime())
}
