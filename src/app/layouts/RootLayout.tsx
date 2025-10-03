import { Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from '@/shared/components/navigation/AppSidebar'
import { AppNavbar } from '@/shared/components/navigation/AppNavbar'
import { SidebarInset } from '@/shared/ui/sidebar'

export default function RootLayout() {
  const location = useLocation()

  const hideNavRoutes = ['/authentication']
  const shouldHideNav = hideNavRoutes.includes(location.pathname)

  if (shouldHideNav) {
    return (
      <div className="h-dvh w-dvw">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex h-dvh w-dvw overflow-hidden">
      {/* Sidebar fijo */}
      <AppSidebar />

      {/* Contenido principal */}
      <SidebarInset className="flex-1 flex flex-col min-h-0">
        {/* Navbar global fija */}
        <AppNavbar />

        {/* Espacio para cada página (Outlet) */}
        <div className="p-4  flex-1 flex flex-col overflow-hidden min-h-0">
          <Outlet />
        </div>
      </SidebarInset>
    </div>
  )
}