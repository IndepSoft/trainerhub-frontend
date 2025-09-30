import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  AlertTriangle,
  Award,
  Calendar,
  Flame,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import React, { useState } from 'react'
import { StatCard } from '../components/StatCard'
import { QuickActionCard } from '../components/QuickActionCard'
import { RecentAchievementsItem } from '../components/RecentAchievementsItem'
import { MetricCard } from '../components/MetricCard'
import { NotificationItem } from '../components/NotificationItem'
import { StreakTrackingSystem } from '../components/StreakTrackingSystem'
import { PersonalizedChallenges } from '../components/PersonalizedChallenges'
import { AchievementSystem } from '../components/AchievementSystem'

export default function Gamification() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gamificación</h1>
          <p className="text-muted-foreground">
            Sistema de motivación y logros para estudiantes
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          icon={Trophy}
          color="text-yellow-600"
          label="Logros Activos"
          value={1}
        />
        <StatCard
          icon={Target}
          color="text-blue-600"
          label="Desafíos Activos"
          value={2}
        />
        <StatCard
          icon={Flame}
          color="text-orange-600"
          label="Rachas Activas"
          value={3}
        />
        <StatCard
          icon={Users}
          color="text-green-600"
          label="Participación"
          value="4%"
        />
        <StatCard
          icon={TrendingUp}
          color="text-purple-600"
          label="Puntos Totales"
          value={5}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Gamificación</CardTitle>
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <QuickActionCard
                    icon={Trophy}
                    bgColor="bg-yellow-100"
                    iconColor="text-yellow-600"
                    title="Gestionar Logros"
                    description="Ver progreso de achievements"
                    onClick={() => setActiveTab('achievements')}
                  />
                  <QuickActionCard
                    icon={Target}
                    bgColor="bg-blue-100"
                    iconColor="text-blue-600"
                    title="Crear Desafíos"
                    description="Nuevos retos personalizados"
                    onClick={() => setActiveTab('challenges')}
                  />
                  <QuickActionCard
                    icon={Flame}
                    bgColor="bg-orange-100"
                    iconColor="text-orange-600"
                    title="Monitorear Rachas"
                    description="Seguimiento de consistencia"
                    onClick={() => setActiveTab('streaks')}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Award className="h-5 w-5" />
                        <span>Logros Recientes</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <RecentAchievementsItem
                          icon={Trophy}
                          bgColor="bg-green-50"
                          iconColor="text-yellow-600"
                          name="Ana García"
                          description='Desbloqueó "Hábito Formado"'
                          time="Hace 2h"
                        />
                        <RecentAchievementsItem
                          icon={Trophy}
                          bgColor="bg-blue-50"
                          iconColor="text-yellow-600"
                          name="Carlos López"
                          description='Completó "Perfect Week"'
                          time="Hace 5h"
                        />
                        <RecentAchievementsItem
                          icon={Trophy}
                          bgColor="bg-purple-50"
                          iconColor="text-yellow-600"
                          name="María Rodríguez"
                          description='Alcanzó "Transformer"'
                          time="Ayer"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Alertas y Notificaciones</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <NotificationItem
                          icon={AlertTriangle}
                          bgColor="bg-yellow-50 border border-yellow-200"
                          iconColor="text-yellow-600"
                          title="Rachas en Riesgo"
                          description="3 estudiantes necesitan atención"
                        />
                        <NotificationItem
                          icon={Calendar}
                          bgColor="bg-green-50 border border-green-200"
                          iconColor="text-green-600"
                          title="Desafíos por Vencer"
                          description="3 desafíos terminan esta semana"
                        />
                        <NotificationItem
                          icon={Target}
                          bgColor="bg-blue-50 border border-blue-200"
                          iconColor="text-blue-600"
                          title="Nuevos Hitos"
                          description="5 estudiantes cerca de logros"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Métricas de Rendimiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <MetricCard
                        value="3%"
                        label="Tasa de Participación"
                        color="text-green-600"
                      />
                      <MetricCard
                        value={3}
                        label="Desafíos Completados"
                        color="text-blue-600"
                      />
                      <MetricCard
                        value={3}
                        label="Rachas Activas"
                        color="text-orange-600"
                      />
                      <MetricCard
                        value={3}
                        label="Puntos Promedio"
                        color="text-purple-600"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                  Análisis Avanzado de Gamificación
                </h3>
                <p className="text-muted-foreground">
                  Métricas detalladas, reportes de engagement y análisis de
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
