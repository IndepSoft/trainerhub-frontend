"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { Calendar, Target, Trophy, Clock, User, Edit, Pause, Play } from "lucide-react"
import { cn } from '@/shared/lib/utils'

interface PersonalChallenge {
  id: string
  title: string
  description: string
  studentId: string
  studentName: string
  createdBy: string
  objective: {
    type: "weight_loss" | "strength_gain" | "endurance" | "attendance" | "habit_formation"
    target: number
    unit: string
    currentValue: number
    measurable: boolean
    trackingFrequency: "daily" | "weekly" | "per_session"
  }
  startDate: Date
  endDate: Date
  reward: {
    type: "discount" | "free_session" | "supplement" | "custom"
    value: string
    description: string
  }
  status: "active" | "completed" | "failed" | "paused"
  progress: number
  milestones: Array<{
    percentage: number
    title: string
    achieved: boolean
    achievedDate?: Date
  }>
}

interface ChallengeCardProps {
  challenge: PersonalChallenge
  showProgress?: boolean
  allowEdit?: boolean
  onUpdate?: (progress: number) => void
  onEdit?: () => void
  onTogglePause?: () => void
}

const challengeTypeColors = {
  weight_loss: "bg-red-50 text-red-700 border-red-200",
  strength_gain: "bg-blue-50 text-blue-700 border-blue-200",
  endurance: "bg-green-50 text-green-700 border-green-200",
  attendance: "bg-purple-50 text-purple-700 border-purple-200",
  habit_formation: "bg-orange-50 text-orange-700 border-orange-200",
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
  paused: "bg-yellow-100 text-yellow-800",
}

export function ChallengeCard({
  challenge,
  showProgress = true,
  allowEdit = false,
  onUpdate,
  onEdit,
  onTogglePause,
}: ChallengeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const daysRemaining = Math.ceil((challenge.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = Math.ceil((challenge.endDate.getTime() - challenge.startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysElapsed = totalDays - daysRemaining

  const completedMilestones = challenge.milestones.filter((m) => m.achieved).length
  const nextMilestone = challenge.milestones.find((m) => !m.achieved)

  return (
    <Card className={cn("transition-all duration-200", isExpanded && "ring-2 ring-blue-200")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={challengeTypeColors[challenge.objective.type]}>
                {challenge.objective.type.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className={statusColors[challenge.status]}>
                {challenge.status}
              </Badge>
            </div>
            <CardTitle className="text-lg">{challenge.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            {allowEdit && (
              <>
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onTogglePause}>
                  {challenge.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Student Info */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Estudiante: {challenge.studentName}</span>
        </div>

        {/* Progress Section */}
        {showProgress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progreso General</span>
              <span className="text-sm text-muted-foreground">{Math.round(challenge.progress)}%</span>
            </div>
            <Progress value={challenge.progress} className="h-2" />

            {/* Current vs Target */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span>
                  {challenge.objective.currentValue} / {challenge.objective.target} {challenge.objective.unit}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{daysRemaining > 0 ? `${daysRemaining} días restantes` : "Vencido"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Milestones */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Hitos</span>
            <span className="text-sm text-muted-foreground">
              {completedMilestones}/{challenge.milestones.length} completados
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {challenge.milestones.map((milestone, index) => (
              <div
                key={index}
                className={cn(
                  "p-2 rounded-lg text-center text-xs",
                  milestone.achieved
                    ? "bg-green-100 text-green-800"
                    : milestone.percentage <= challenge.progress
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600",
                )}
              >
                <div className="font-semibold">{milestone.percentage}%</div>
                <div className="truncate">{milestone.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reward */}
        <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
          <Trophy className="h-4 w-4 text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm font-medium">Recompensa</p>
            <p className="text-xs text-muted-foreground">{challenge.reward.description}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Inicio: {challenge.startDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Fin: {challenge.endDate.toLocaleDateString()}</span>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <Button variant="ghost" size="sm" className="w-full" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? "Ver menos" : "Ver más detalles"}
        </Button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            <div>
              <h4 className="text-sm font-medium mb-2">Detalles del Objetivo</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <p className="font-medium">{challenge.objective.type.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Frecuencia:</span>
                  <p className="font-medium">{challenge.objective.trackingFrequency}</p>
                </div>
              </div>
            </div>

            {nextMilestone && (
              <div>
                <h4 className="text-sm font-medium mb-2">Próximo Hito</h4>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium">{nextMilestone.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Objetivo: {nextMilestone.percentage}% (
                    {(challenge.objective.target * nextMilestone.percentage) / 100} {challenge.objective.unit})
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}