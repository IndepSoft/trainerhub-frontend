import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { getInitials, getShortName } from '@/shared/lib/personName'
import { useLogout } from '@/auth/hooks/useLogout'

interface UserMenuProps {
  /**
   * Quien ha entrado, venga su nombre de donde venga.
   *
   * Antes recibia un `Trainer`, y un alumno no tiene ficha de entrenador: el
   * menu pintaba las iniciales de `undefined`. Quien resuelve de que ficha sale
   * el nombre es `useViewer`, que es el unico que sabe con que papel se entra.
   */
  person: { firstName?: string; lastName?: string; photoUrl?: string }
  loading: boolean
}

export function UserMenu({ person, loading }: UserMenuProps) {
  const navigate = useNavigate()
  const { handleLogout } = useLogout()
  
  const displayName = getShortName(person.firstName, person.lastName)
  const initials = getInitials(person.firstName, person.lastName)
  const avatarUrl = person.photoUrl

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
        {/* Lleva a Configuracion, que es donde vive el perfil. Era una entrada
            de menu sin `onClick` ni enlace: no hacia absolutamente nada. */}
        <DropdownMenuItem onSelect={() => navigate('/settings')}>
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