import { Crown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

export function PersonCard() {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col gap-0.5 leading-none">
        <span className="font-semibold">Carlos Mendoza</span>
        <div className="flex items-center gap-1">
          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-lg">
            Plan Gratuito
          </span>
          <Crown className="w-3 h-3 text-orange-500" />
        </div>
      </div>
    </div>
  )
}
