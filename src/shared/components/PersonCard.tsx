import { Crown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { getInitials, getShortName } from '@/shared/lib/personName'
import type { Trainer } from '@/shared/domain/entities/trainer'

interface PersonCardProps {
  trainer: Trainer | null
  loading: boolean
}

/**
 * Solo pinta. Antes llamaba a `useAuth` y `useTrainer` por su cuenta, asi que
 * cada sitio donde se montaba -barra lateral y menu movil- lanzaba su propia
 * peticion del mismo entrenador. Ahora los datos llegan por props desde
 * RootLayout, que los pide una sola vez.
 */
export function PersonCard({ trainer, loading }: PersonCardProps) {
  if (loading) {
    return <PersonCardSkeleton />
  }

  const displayName = getShortName(trainer?.firstName, trainer?.lastName)
  const initials = getInitials(trainer?.firstName, trainer?.lastName)

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        <AvatarImage src={trainer?.photoUrl} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-0.5 leading-none">
        <span className="font-semibold">{displayName}</span>

        <div className="flex items-center gap-1">
          <span className="rounded-action border border-ember/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ember-deep">
            Plan Gratuito
          </span>
          <Crown className="w-3 h-3 text-ember" />
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
