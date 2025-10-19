import { SidebarTrigger } from '@/shared/ui/sidebar'
import { getNavbarRoutes } from '@/app/config/navigation.config'
import { NavItem } from './NavItem'
import { MobileMenu } from './MobileMenu'
import { UserMenu } from './UserMenu'
import { NotificationButton } from './NotificationButton'
import { useAuth } from '@/auth/hooks/useAuth'
import { useTrainer } from '@/shared/hooks/useTrainer'

export function AppNavbar() {
  const navbarRoutes = getNavbarRoutes()
  const { user } = useAuth()
  const { trainer, loading } = useTrainer(user?.id)

  return (
    <header className="h-16 border-b flex-shrink-0">
      <div className="flex items-center h-16 px-4">
        <SidebarTrigger className="mr-4 hidden md:flex" />
        <MobileMenu />

        <div className="flex-1 flex justify-between items-center">
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

          <div className="flex items-center space-x-2">
            <NotificationButton />
            <UserMenu trainer={trainer} loading={loading} />
          </div>
        </div>
      </div>
    </header>
  )
}
