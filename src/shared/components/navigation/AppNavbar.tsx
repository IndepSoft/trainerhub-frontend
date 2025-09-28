import { SidebarTrigger } from '@/shared/ui/sidebar'
import { getNavbarRoutes } from '@/app/config/navigation.config'
import { NavItem } from './NavItem'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { MobileMenu } from './MobileMenu'
import { Bell } from 'lucide-react'

export function AppNavbar() {
  const navbarRoutes = getNavbarRoutes()

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

            {/* Menú de usuario */}
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
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Carlos Mendoza</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
