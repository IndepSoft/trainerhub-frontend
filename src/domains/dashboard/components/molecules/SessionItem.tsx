import { Badge } from '@/shared/ui/badge'

export interface ISessionItem {
  customer: string
  scheduledDate: string
  activity: string
  status: 'programmed' | 'confirmed' | 'canceled'
}

export default function SessionItem({
  customer,
  scheduledDate,
  activity,
  status,
}: ISessionItem) {
  return (
    <div className="flex items-center">
      <div className="flex-1">
        <span className="font-semibold text-md">{customer}</span>
        <p className="text-muted-foreground">
          {scheduledDate} - {activity}
        </p>
      </div>
      <div className="">
        {status == 'programmed' && (
          <Badge className="bg-primary">Programada</Badge>
        )}
        {status == 'confirmed' && (
          <Badge className="bg-green-500">Confirmada</Badge>
        )}
        {status == 'canceled' && (
          <Badge className="bg-red-500">Cancelada</Badge>
        )}
      </div>
    </div>
  )
}
