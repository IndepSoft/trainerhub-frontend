import { Card, CardContent } from '@/shared/ui/card'
import type { LucideIcon } from 'lucide-react'

type QuickActionCardProps = {
  icon: LucideIcon
  bgColor: string
  iconColor: string
  title: string
  description: string
  onClick: () => void
}

export function QuickActionCard({
  icon: Icon,
  bgColor,
  iconColor,
  title,
  description,
  onClick,
}: QuickActionCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 ${bgColor} rounded-full`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
