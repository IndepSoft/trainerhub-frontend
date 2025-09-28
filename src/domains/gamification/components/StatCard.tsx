import { Card, CardContent } from '@/shared/ui/card'
import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  icon: LucideIcon
  color: string
  label: string
  value: string | number
}

export function StatCard({ icon: Icon, color, label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <Icon className={`h-5 w-5 ${color}`} />
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
