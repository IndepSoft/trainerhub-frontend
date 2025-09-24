import { Link } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter
} from "@/shared/ui/sidebar"
import { GalleryVerticalEnd } from "lucide-react"
import { getSidebarRoutes } from "@/app/config/navigation.config"
import { NavItem } from "./NavItem"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const sidebarRoutes = getSidebarRoutes()

  return (
    <Sidebar variant="inset" {...props}>
      
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">TrainerHub</span>
                  <span className="text-xs">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Contenido - Navegación Dinámica */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Aplicación</SidebarGroupLabel>
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <GalleryVerticalEnd className="size-4" />
              <span>v1.0.0</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
    </Sidebar>
  )
}