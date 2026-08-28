import { Link } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/shared/ui/sidebar'
import { GalleryVerticalEnd } from 'lucide-react'
import { getSidebarRoutes } from '@/app/config/navigation.config'
import { NavItem } from './NavItem'
import { PersonCard } from '../PersonCard'
import { Separator } from '@/shared/ui/separator'
import type { Trainer } from '@/shared/domain/entities/trainer'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  trainer: Trainer | null
  loading: boolean
}

export function AppSidebar({ trainer, loading, ...props }: AppSidebarProps) {
  const sidebarRoutes = getSidebarRoutes()

  return (
    <Sidebar variant="inset" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="text-2xl font-bold tracking-wide justify-center"
              asChild
            >
              <Link to="/">TrainerHub</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Separator className="my-1" />
          <SidebarMenuItem>
            <div className="px-4 py-4 border-b border-t">
              <PersonCard trainer={trainer} loading={loading} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Contenido - Navegación Dinámica */}
      <SidebarContent>
        <SidebarGroup>
          <Separator className="my-2" />
          <SidebarGroupContent>
            <nav className="space-y-1">
              {sidebarRoutes.map((route) => (
                <NavItem
                  key={route.id}
                  to={route.href}
                  icon={route.icon}
                  badge={route.badge}
                  disabled={route.disabled}
                >
                  {route.label}
                </NavItem>
              ))}
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <div className="border-t bg-gray-50">
          <p className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground">
            <GalleryVerticalEnd className="size-4" />
            <span>v1.0.0</span>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
