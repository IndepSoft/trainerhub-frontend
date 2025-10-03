export type ChallengeStatus = "active" | "completed" | "paused" | "failed"

export type TrackingFrequency = "weekly" | "per_session" | "daily"

export type RewardType = "discount" | "free_session" | "supplement" | "custom"

export type Objective =
  | {
      type: "weight_loss"
      target: number
      unit: "kg"
      currentValue: number
      measurable: true
      trackingFrequency: "weekly"
    }
  | {
      type: "strength_gain"
      target: number
      unit: "kg"
      currentValue: number
      measurable: true
      trackingFrequency: "per_session"
    }
  | {
      type: "attendance"
      target: number
      unit: "sessions"
      currentValue: number
      measurable: true
      trackingFrequency: "daily"
    }
  | {
      type: "habit_formation"
      target: number
      unit: string
      currentValue: number
      measurable: true
      trackingFrequency: "daily" | "weekly"
    }
  | {
      type: "endurance"
      target: number
      unit: string
      currentValue: number
      measurable: true
      trackingFrequency: "per_session" | "weekly"
    }

export type Milestone = {
  percentage: number
  title: string
  achieved: boolean
  achievedDate?: Date
}

export type Reward = {
  type: "discount" | "free_session" | "supplement" | string
  value: string
  description: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  studentId: string
  studentName: string
  createdBy: string
  objective: Objective
  startDate: Date
  endDate: Date
  reward: {
    type: RewardType
    value: string
    description: string
  }
  status: ChallengeStatus
  progress: number
  milestones: Milestone[]
}
