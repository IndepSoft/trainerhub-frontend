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
    <div className="flex h-dvh w-dvw">
      {/* Sidebar */}
      <AppSidebar />

      {/* Contenido con inset */}
      <SidebarInset className="flex-1 flex flex-col">
        <AppNavbar />

        <main className="flex-1 overflow-auto">
          <div className="p-4 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </div>
  )
}
