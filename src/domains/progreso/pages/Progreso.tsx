import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { StatCard } from '../components/StatCard'
import { ProgressOverviewPanel } from '../components/ProgressOverviewPanel'
import { StreakTrackingSystem } from '../components/StreakTrackingSystem'
import { PersonalizedChallenges } from '../components/PersonalizedChallenges'
import { AchievementSystem } from '../components/AchievementSystem'
import { useProgressOverview } from '../hooks/useProgressOverview'

export default function Progreso() {
  const [activeTab, setActiveTab] = useState('overview')
  const { overview } = useProgressOverview()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progreso</h1>
          <p className="text-muted-foreground">
            Logros, desafíos y rachas de tus estudiantes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {overview.stats.map((stat) => (
          <StatCard
            key={stat.id}
            icon={stat.icon}
            color={stat.color}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seguimiento de Progreso</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="achievements">Logros</TabsTrigger>
              <TabsTrigger value="challenges">Desafíos</TabsTrigger>
              <TabsTrigger value="streaks">Rachas</TabsTrigger>
              <TabsTrigger value="analytics">Análisis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <ProgressOverviewPanel
                overview={overview}
                onNavigateToTab={setActiveTab}
              />
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
              <AchievementSystem />
            </TabsContent>

            <TabsContent value="challenges" className="mt-6">
              <PersonalizedChallenges />
            </TabsContent>

            <TabsContent value="streaks" className="mt-6">
              <StreakTrackingSystem />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Análisis Avanzado de Progreso
                </h3>
                <p className="text-muted-foreground">
                  Métricas detalladas, reportes de participación y análisis de
                  efectividad estarán disponibles próximamente.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
