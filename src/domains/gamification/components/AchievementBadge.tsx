"use client"

import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { Trophy, Star, Target, Flame, Award, Medal } from "lucide-react"
import { cn } from '@/shared/lib/utils'
import type { Achievement } from '../types/achievement.types'

interface AchievementBadgeProps {
  achievement: Achievement
  unlocked: boolean
  showProgress?: boolean
  size?: "small" | "medium" | "large"
  onClick?: () => void
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  target: Target,
  flame: Flame,
  award: Award,
  medal: Medal,
}

const rarityColors = {
  common: "bg-gray-100 border-gray-300 text-gray-700",
  rare: "bg-blue-100 border-blue-300 text-blue-700",
  epic: "bg-purple-100 border-purple-300 text-purple-700",
  legendary: "bg-yellow-100 border-yellow-300 text-yellow-700",
}

const categoryColors = {
  attendance: "bg-green-50 text-green-700",
  consistency: "bg-blue-50 text-blue-700",
  metrics: "bg-orange-50 text-orange-700",
  challenges: "bg-purple-50 text-purple-700",
}

export function AchievementBadge({
  achievement,
  unlocked,
  showProgress = false,
  size = "medium",
  onClick,
}: AchievementBadgeProps) {
  const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Trophy

  const sizeClasses = {
    small: "w-16 h-20 p-2",
    medium: "w-24 h-28 p-3",
    large: "w-32 h-36 p-4",
  }

  const iconSizes = {
    small: 16,
    medium: 24,
    large: 32,
  }

  return (
    <Card
      className={cn(
        "relative transition-all duration-300 cursor-pointer hover:scale-105",
        sizeClasses[size],
        unlocked ? rarityColors[achievement.rarity] : "bg-gray-50 border-gray-200 opacity-60",
        onClick && "hover:shadow-lg",
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center h-full p-0">
        <div
          className={cn(
            "rounded-full p-2 mb-2",
            unlocked ? categoryColors[achievement.category] : "bg-gray-100 text-gray-400",
          )}
        >
          <IconComponent size={iconSizes[size]} />
        </div>

        <div className="text-center">
          <h4
            className={cn(
              "font-semibold leading-tight",
              size === "small" ? "text-xs" : size === "medium" ? "text-sm" : "text-base",
            )}
          >
            {achievement.name}
          </h4>

          {size !== "small" && (
            <p className={cn("text-xs text-muted-foreground mt-1 line-clamp-2", !unlocked && "text-gray-400")}>
              {achievement.description}
            </p>
          )}
        </div>

        {unlocked && achievement.unlockedAt && (
          <Badge
            variant="secondary"
            className={cn("absolute -top-2 -right-2 text-xs", size === "small" && "text-[10px] px-1")}
          >
            +{achievement.pointsReward}
          </Badge>
        )}

        {!unlocked && (
          <div className="absolute inset-0 bg-gray-200/50 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}