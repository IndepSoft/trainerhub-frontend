import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Award, AlertTriangle, Flame, Target, Trophy } from 'lucide-react'
import { QuickActionCard } from './QuickActionCard'
import { RecentAchievementsItem } from './RecentAchievementsItem'
import { NotificationItem } from './NotificationItem'
import { MetricCard } from './MetricCard'
import type { ProgressOverview } from '../types/progress.types'

/**
 * Pestaña de resumen.
 *
 * Eran unas ciento ochenta de las doscientas cuarenta y cinco lineas de la
 * pagina, con todos los datos escritos entre el marcado: tres logros recientes,
 * tres notificaciones y cuatro metricas, cada uno como un bloque repetido a
 * mano. Ahora recibe los datos y los recorre.
 */
interface ProgressOverviewPanelProps {
  overview: ProgressOverview
  onNavigateToTab: (tab: string) => void
}

export function ProgressOverviewPanel({
  overview,
  onNavigateToTab,
}: ProgressOverviewPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          icon={Trophy}
          bgColor="bg-yellow-100"
          iconColor="text-yellow-600"
          title="Gestionar Logros"
          description="Ver progreso de achievements"
          onClick={() => onNavigateToTab('achievements')}
        />
        <QuickActionCard
          icon={Target}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          title="Crear Desafíos"
          description="Nuevos retos personalizados"
          onClick={() => onNavigateToTab('challenges')}
        />
        <QuickActionCard
          icon={Flame}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
          title="Monitorear Rachas"
          description="Seguimiento de consistencia"
          onClick={() => onNavigateToTab('streaks')}
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
              {overview.recentAchievements.map((achievement) => (
                <RecentAchievementsItem
                  key={achievement.id}
                  icon={achievement.icon}
                  bgColor={achievement.bgColor}
                  iconColor={achievement.iconColor}
                  name={achievement.name}
                  description={achievement.description}
                  time={achievement.time}
                />
              ))}
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
              {overview.alerts.map((alert) => (
                <NotificationItem
                  key={alert.id}
                  icon={alert.icon}
                  bgColor={alert.bgColor}
                  iconColor={alert.iconColor}
                  title={alert.title}
                  description={alert.description}
                />
              ))}
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
            {overview.metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                value={metric.value}
                label={metric.label}
                color={metric.color}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
