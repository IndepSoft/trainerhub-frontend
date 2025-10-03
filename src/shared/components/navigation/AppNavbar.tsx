import { SidebarTrigger } from '@/shared/ui/sidebar'
import { getNavbarRoutes } from '@/app/config/navigation.config'
import { NavItem } from './NavItem'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { MobileMenu } from './MobileMenu'
import { Bell, LogOut, User } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/shared/ui/dropdown-menu'
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'

export function AppNavbar() {
  const navbarRoutes = getNavbarRoutes()

  const handleLogout = () => {
    console.log("Cerrar sesión")
    // aquí iría tu lógica real de logout (ej: llamada API, limpiar storage, redirect, etc.)
  }

  return (
    <header className="h-16 border-b flex-shrink-0">
      <div className="flex items-center h-16 px-4">
        {/* Botón para toggle del sidebar */}
        <SidebarTrigger className="mr-4 hidden md:flex" />
        <MobileMenu />

        <div className="flex-1 flex justify-between items-center">
          {/* Navegación Principal - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navbarRoutes.map((route) => (
              <NavItem
                key={route.id}
                to={route.href}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                badge={route.badge}
                disabled={route.disabled}
              >
                {route.label}
              </NavItem>
            ))}
          </nav>

          {/* Área de acciones - Usuario, notificaciones, etc. */}
          <div className="flex items-center space-x-2">
            {/* Botón de notificaciones */}
            <button className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors">
              <Bell className="h-4 w-4" />
            </button>

            {/* Menú de usuario con dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <Avatar>
                        <AvatarImage
                          src="https://github.com/shadcn.png"
                          alt="@shadcn"
                        />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="hidden md:flex flex-col gap-0.5 leading-none text-left">
                      <span className="font-semibold">Carlos Mendoza</span>
                    </div>
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
          </div>
        </div>
      </div>
    </header>
  )
}
