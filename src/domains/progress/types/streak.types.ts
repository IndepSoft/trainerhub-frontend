export type StreakStatus = 'active' | 'at_risk' | 'broken'

export type StreakType = 'workout' | 'nutrition' | 'weigh_in' | 'check_in'

export type Milestone = {
  days: number
  title: string
  reward: string
  achieved: boolean
  achievedDate?: Date
}

export type StreakData = {
  studentId: string
  studentName: string
  streakType: StreakType
  currentStreak: number
  longestStreak: number
  lastActivity: Date
  streakStatus: StreakStatus
  riskLevel: number
  milestones: Milestone[]
}

export interface StreakCounterProps {
  streakData: StreakData
  showRiskAlert?: boolean
  onStreakAction?: (action: 'freeze' | 'extend') => void
  size?: 'small' | 'medium' | 'large'
}