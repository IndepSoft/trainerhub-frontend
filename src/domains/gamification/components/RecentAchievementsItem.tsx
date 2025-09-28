import type { LucideIcon } from 'lucide-react'

type RecentAchievementsItemProps = {
  icon: LucideIcon
  bgColor: string
  iconColor: string
  name: string
  description: string
  time: string
}

export function RecentAchievementsItem({
  icon: Icon,
  bgColor,
  iconColor,
  name,
  description,
  time,
}: RecentAchievementsItemProps) {
  return (
    <div className={`flex items-center space-x-3 p-3 ${bgColor} rounded-lg`}>
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <div className="flex-1">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </div>
  )
}
