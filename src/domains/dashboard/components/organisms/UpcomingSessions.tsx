import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import SessionItem, { type ISessionItem } from '../molecules/SessionItem'
import { useEffect, useState } from 'react'

export default function UpcomingSessions() {
  const [sessions, setSessions] = useState<ISessionItem[]>([])

  useEffect(() => {
    setSessions([
      {
        customer: 'María González',
        activity: 'Evaluación',
        scheduledDate: 'Hoy 9:00 AM',
        status: 'programmed',
      },
      {
        customer: 'Diego Ramírez',
        activity: 'Fuerza',
        scheduledDate: 'Hoy 9:30 AM',
        status: 'canceled',
      },
      {
        customer: 'Edward Mamani',
        activity: 'Fuerza',
        scheduledDate: 'Hoy 10:30 AM',
        status: 'confirmed',
      },
    ])
  }, [])

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="font-bold text-lg">Próximas Sesiones</CardTitle>
      </CardHeader>
      <CardContent className="">
        <div className="flex flex-col gap-4">
          {sessions.map((session, i) => (
            <SessionItem
              key={i}
              customer={session.customer}
              scheduledDate={session.scheduledDate}
              activity={session.activity}
              status={session.status}
            ></SessionItem>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
