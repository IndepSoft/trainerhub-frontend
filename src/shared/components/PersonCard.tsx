import { Crown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useAuth } from '@/auth/hooks/useAuth'
import { useTrainer } from '../hooks/useTrainer'
import { getInitials, getShortName } from '../utils/nameHelpers'

export function PersonCard() {
  const { user } = useAuth()
  const { trainer, loading } = useTrainer(user?.id)

  if (loading) {
    return <PersonCardSkeleton />
  }

  const displayName = getShortName(trainer?.first_name, trainer?.last_name)
  const initials = getInitials(trainer?.first_name, trainer?.last_name)
  const avatarUrl = trainer?.photo_url || undefined

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col gap-0.5 leading-none">
        <span className="font-semibold">{displayName}</span>
        
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

function PersonCardSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
      <div className="flex flex-col gap-1">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}