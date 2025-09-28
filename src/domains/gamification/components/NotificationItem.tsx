import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface NotificationItemProps {
  icon: LucideIcon
  bgColor: string
  iconColor: string
  title: string
  description: string
}

export function NotificationItem({
  icon: Icon,
  bgColor,
  iconColor,
  title,
  description,
}: NotificationItemProps) {
  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg ${bgColor}`}>
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
