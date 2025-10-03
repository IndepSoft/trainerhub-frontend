import type { StreakStatus } from '../types/streak.types'

export const getFlameIntensity = (streak: number) => {
  if (streak >= 100) return { intensity: 'legendary', color: 'text-yellow-500', size: 'h-8 w-8' }
  if (streak >= 50) return { intensity: 'epic', color: 'text-orange-500', size: 'h-7 w-7' }
  if (streak >= 21) return { intensity: 'rare', color: 'text-red-500', size: 'h-6 w-6' }
  if (streak >= 7) return { intensity: 'common', color: 'text-orange-400', size: 'h-5 w-5' }
  return { intensity: 'starter', color: 'text-gray-400', size: 'h-4 w-4' }
}

export const getRiskColor = (status: StreakStatus, riskLevel: number) => {
  if (status === 'broken') return 'text-gray-500'
  if (status === 'at_risk') return riskLevel <= 6 ? 'text-red-500' : 'text-yellow-500'
  return 'text-green-500'
}