"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { AchievementBadge } from "./AchievementBadge"
import { Filter } from "lucide-react"
import { predefinedAchievements } from "../data/predefinedAchievements"

interface AchievementSystemProps {
  studentId?: string
}

// TODO: `studentId` no se usa; los logros salen de predefinedAchievements (mock),
// sin filtrar por estudiante.
export function AchievementSystem(_props: AchievementSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedRarity, setSelectedRarity] = useState<string>("all")

  const unlockedAchievements = predefinedAchievements.filter((a) => a.unlockedAt)

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
      {/*
        Aqui habia cuatro tarjetas de contador. Se eliminan porque tres de ellas
        repetian datos que ya estan mas arriba en la pagina:

        - «Total Achievements» lo dice el contador «Logros activos».
        - «Total Points» competia con la barra de XP como si fueran dos sistemas
          de puntos distintos. Se decidio que solo hay uno, XP.
        - «Current Streak» decia «21 days» ESCRITO A MANO, mientras la cabecera
          de gamificacion mostraba 12. Dos rachas distintas en la misma pantalla.

        Sobrevive lo unico que no estaba duplicado -cuantos logros van de
        cuantos-, como una linea de contexto y no como una fila de tarjetas.
      */}
      <p className="text-sm text-ink/50">
        <span className="metric-figures font-display text-2xl font-extrabold text-ink">
          {unlockedAchievements.length}
        </span>
        <span className="metric-figures text-ink/40"> / {predefinedAchievements.length}</span>
        {' logros desbloqueados · '}
        <span className="metric-figures font-semibold text-cobalt">
          {Math.round((unlockedAchievements.length / predefinedAchievements.length) * 100)}%
        </span>
      </p>

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
            <TabsList className="w-full md:grid md:grid-cols-5">
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
                  {/* XP y no «pts»: se decidio que hay un unico sistema de puntos. La
                      pantalla de celebracion ya mostraba «+500 XP» para este mismo
                      numero, asi que «pts» hacia parecer que eran dos cosas. */}
                  <span className="metric-figures shrink-0 font-display text-sm font-bold text-cobalt">
                    +{achievement.pointsReward} XP
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}