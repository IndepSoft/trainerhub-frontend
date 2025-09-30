"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Badge } from '@/shared/ui/badge'
import { AchievementBadge } from "./AchievementBadge"
import { Trophy, Star, Target, Flame, Filter } from "lucide-react"
import { predefinedAchievements } from "../data/predefinedAchievements"

interface AchievementSystemProps {
  studentId?: string
}

export function AchievementSystem({ studentId }: AchievementSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedRarity, setSelectedRarity] = useState<string>("all")

  const unlockedAchievements = predefinedAchievements.filter((a) => a.unlockedAt)
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.pointsReward, 0)

  const filteredAchievements = predefinedAchievements.filter((achievement) => {
    const categoryMatch = selectedCategory === "all" || achievement.category === selectedCategory
    const rarityMatch = selectedRarity === "all" || achievement.rarity === selectedRarity
    return categoryMatch && rarityMatch
  })

  const categoryStats = {
    attendance: predefinedAchievements.filter((a) => a.category === "attendance" && a.unlockedAt).length,
    consistency: predefinedAchievements.filter((a) => a.category === "consistency" && a.unlockedAt).length,
    metrics: predefinedAchievements.filter((a) => a.category === "metrics" && a.unlockedAt).length,
    challenges: predefinedAchievements.filter((a) => a.category === "challenges" && a.unlockedAt).length,
  }

  return (
    <div className="space-y-6">
      {/* Achievement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Total Achievements</p>
                <p className="text-2xl font-bold">
                  {unlockedAchievements.length}/{predefinedAchievements.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Points</p>
                <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Current Streak</p>
                <p className="text-2xl font-bold">21 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round((unlockedAchievements.length / predefinedAchievements.length) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Achievement Gallery
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Rarities</option>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({unlockedAchievements.length})</TabsTrigger>
              <TabsTrigger value="attendance">Attendance ({categoryStats.attendance})</TabsTrigger>
              <TabsTrigger value="consistency">Consistency ({categoryStats.consistency})</TabsTrigger>
              <TabsTrigger value="metrics">Metrics ({categoryStats.metrics})</TabsTrigger>
              <TabsTrigger value="challenges">Challenges ({categoryStats.challenges})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredAchievements.map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    unlocked={!!achievement.unlockedAt}
                    size="medium"
                    onClick={() => {
                      // Handle achievement click - could open modal with details
                      console.log("Achievement clicked:", achievement.name)
                    }}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {unlockedAchievements
              .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
              .slice(0, 3)
              .map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <AchievementBadge achievement={achievement} unlocked={true} size="small" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Unlocked {achievement.unlockedAt?.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">+{achievement.pointsReward} pts</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}