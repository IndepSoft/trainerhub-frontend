import { Timeline, TimelineEntry } from '@/shared/components/Timeline'
import { SectionHeading } from './SectionHeading'
import type { RecentActivityEntry } from '../types/dashboard.types'

interface RecentActivityProps {
  activities: RecentActivityEntry[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <section className="flex-1">
      <SectionHeading>Actividad reciente</SectionHeading>

      <div className="pt-5">
        <Timeline>
          {activities.map((activity, index) => (
            <TimelineEntry
              key={activity.id}
              stamp={activity.timeAgo}
              state="done"
              isLast={index === activities.length - 1}
            >
              <p className="text-ink">{activity.event}</p>
            </TimelineEntry>
          ))}
        </Timeline>
      </div>
    </section>
  )
}
