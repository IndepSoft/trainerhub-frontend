import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'
import { getInitials, getShortName } from '@/shared/utils/nameHelpers'
import type { Trainer } from '@/shared/types/trainer'
import { useLogout } from '@/auth/hooks/useLogout'

interface UserMenuProps {
  trainer: Trainer | null
  loading: boolean
}

export function UserMenu({ trainer, loading }: UserMenuProps) {
  const { handleLogout } = useLogout()
  
  const displayName = getShortName(trainer?.first_name, trainer?.last_name)
  const initials = getInitials(trainer?.first_name, trainer?.last_name)
  const avatarUrl = trainer?.photo_url

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Menú de usuario"
        >
          <Avatar>
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="hidden md:flex flex-col gap-0.5 leading-none text-left">
            {loading ? (
              <span className="text-sm text-gray-400">Cargando...</span>
            ) : (
              <span className="font-semibold text-sm">{displayName}</span>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}