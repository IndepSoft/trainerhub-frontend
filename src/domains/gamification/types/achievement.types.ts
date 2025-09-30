
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: "attendance" | "consistency" | "metrics" | "challenges"
  rarity: "common" | "rare" | "epic" | "legendary"
  pointsReward: number
  unlockedAt?: Date
}
