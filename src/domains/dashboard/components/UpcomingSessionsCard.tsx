import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { SessionItem } from './SessionItem'
import type { Session } from '../types/dashboard.types'

interface UpcomingSessionsCardProps {
  sessions: Session[]
}

export function UpcomingSessionsCard({ sessions }: UpcomingSessionsCardProps) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="font-bold text-lg">Próximas Sesiones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {sessions.map((session) => (
            <SessionItem key={session.id} session={session} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
