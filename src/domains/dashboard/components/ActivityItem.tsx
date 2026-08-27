import type {
  ActivityColor,
  RecentActivityEntry,
} from '../types/dashboard.types'

/** Mismo criterio que en SessionItem: tabla en vez de condicionales encadenados. */
const BULLET_COLOR: Record<ActivityColor, string> = {
  green: 'text-green-500',
  primary: 'text-primary',
  secondary: 'text-orange-500',
}

interface ActivityItemProps {
  activity: RecentActivityEntry
}

export function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <div className="flex gap-4 items-baseline">
      <div>
        <span className={`font-bold text-3xl ${BULLET_COLOR[activity.color]}`}>
          •
        </span>
      </div>
      <div className="flex flex-col">
        <p className="font-semibold text-md">{activity.event}</p>
        <p className="text-muted-foreground">{activity.timeAgo}</p>
      </div>
    </div>
  )
}
