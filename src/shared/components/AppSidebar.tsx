import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap,
  BarChart3,
} from 'lucide-react'

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Clientes", 
    url: "/clients",
    icon: Users,
  },
  {
    title: "Entrenamientos",
    url: "/trainings", 
    icon: GraduationCap,
  },
  {
    title: "Reportes",
    url: "/reports", 
    icon: BarChart3,
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <TooltipProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-lg font-bold text-primary">
                TrainerHub
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <a href={item.url} className="flex items-center justify-center">
                              <item.icon className="h-5 w-5" />
                            </a>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10}>
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton asChild>
                        <a href={item.url} className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  )
}