import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ActivityItem } from './ActivityItem'
import type { RecentActivityEntry } from '../types/dashboard.types'

interface RecentActivityCardProps {
  activities: RecentActivityEntry[]
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="font-bold text-lg">
          Actividades Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
