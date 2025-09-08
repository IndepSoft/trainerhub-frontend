export interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroups: string[]
  equipment?: string
  instructions: string[]
}