
export interface IRecentActivityItem {
  event: string
  timeAgo: string
  color: 'green' | 'primary' | 'secondary'
}

export default function ActivityItem({
  event,
  timeAgo,
  color,
}: IRecentActivityItem) {
  return (
    <div className="flex gap-4 items-baseline">
      <div className="">
        {color == 'green' && (
          <span className="font-bold text-3xl text-green-500">•</span>
        )}
        {color == 'primary' && (
          <span className="font-bold text-3xl text-primary">•</span>
        )}
        {color == 'secondary' && (
          <span className="font-bold text-3xl text-orange-500">•</span>
        )}
      </div>
      <div className="flex flex-col ">
        <p className="font-semibold text-md">{event}</p>
        <p className="text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  )
}
