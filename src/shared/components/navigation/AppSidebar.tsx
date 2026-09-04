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
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { NavItem } from './NavItem'
import { CrewSwitcher } from './CrewSwitcher'
import { Separator } from '@/shared/ui/separator'
import type { NavigationViewer } from '@/app/config/navigation.config'
import type { Membership } from '@/shared/domain/entities/crew'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  memberships: Membership[]
  active: Membership | null
  /**
   * Quien navega, entero y en un solo objeto.
   *
   * Eran tres props sueltas —rol, permisos concedidos, si administra la
   * plataforma— y se rompía cada vez que la decisión necesitaba un dato más.
   * Además evita el choque de nombres con el atributo `role` del DOM: estas
   * props extienden las de `Sidebar`, que a su vez son las de un <div>, y
   * llamarlo `role` pintaba `role="trainer"` en el marcado.
   */
  navigationViewer: NavigationViewer
  loading: boolean
  onSelectCrew: (crewId: string) => void
}

export function AppSidebar({
  memberships,
  active,
  navigationViewer,
  loading,
  onSelectCrew,
  ...props
}: AppSidebarProps) {
  // Los destinos dependen del papel: el padron de alumnos y el catalogo son de
  // gestion, y un alumno no tiene nada que hacer ahi.
  const { t } = useTranslation()
  const sidebarRoutes = getSidebarRoutes(navigationViewer)

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
              <CrewSwitcher
                memberships={memberships}
                active={active}
                loading={loading}
                onSelect={onSelectCrew}
              />
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
                  {t(route.labelKey)}
                </NavItem>
              ))}
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <div className="border-t bg-cobalt-tint-1">
          <p className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground">
            <GalleryVerticalEnd className="size-4" />
            <span>v1.0.0</span>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
