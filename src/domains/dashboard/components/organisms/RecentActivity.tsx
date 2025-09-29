import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import ActivityItem, {
  type IRecentActivityItem,
} from '../molecules/ActivityItem'
import { useEffect, useState } from 'react'

export default function RecentActivity() {
  const [recentActivityEvents, setRecentActivityEvents] = useState<
    IRecentActivityItem[]
  >([])

  useEffect(() => {
    setRecentActivityEvents([
      {
        event: 'María completó su rutina de cardio',
        timeAgo: 'Hace 2 horas',
        color: 'primary',
      },
      {
        event: 'Pago recibido de Diego Ramírez',
        timeAgo: 'Hace 1 día',
        color: 'green',
      },
      {
        event: 'Nueva rutina creada: "Fuerza Avanzada"',
        timeAgo: 'Hace 2 días',
        color: 'secondary',
      },
    ])
  }, [])

  return (
    <Card className="flex-1">
      <CardHeader>
		    <CardTitle className="font-bold text-lg">Actividades Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {recentActivityEvents.map((session, i) => (
            <ActivityItem
              key={i}
              event={session.event}
              timeAgo={session.timeAgo}
              color={session.color}
            ></ActivityItem>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
