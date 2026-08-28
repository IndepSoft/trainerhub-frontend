import { Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from '@/shared/components/navigation/AppSidebar'
import { AppNavbar } from '@/shared/components/navigation/AppNavbar'
import { SidebarInset } from '@/shared/ui/sidebar'
import { useAuth } from '@/auth/hooks/useAuth'
import { useTrainer } from '@/app/hooks/useTrainer'

export default function RootLayout() {
  const location = useLocation()
  const { user } = useAuth()

  /*
   * El entrenador se pide aqui y una sola vez. Antes lo pedian por su cuenta
   * PersonCard -montado en la barra lateral y en el menu movil- y AppNavbar,
   * asi que cada carga lanzaba dos o tres GET del mismo registro. El layout es
   * el unico ancestro comun de los tres, y por tanto su sitio.
   */
  const { trainer, loading } = useTrainer(user?.id)

  /*
   * Rutas a pantalla completa, sin barra lateral ni superior. La celebracion
   * entra aqui porque el registro agresivo depende de ocupar la pantalla
   * entera: con la navegacion alrededor, el bloque diagonal se lee como un
   * banner dentro de la aplicacion y no como un momento.
   */
  const hideNavRoutes = ['/authentication', '/progress/celebracion']
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
      <AppSidebar trainer={trainer} loading={loading} />

      <SidebarInset className="flex-1 flex flex-col min-h-0">
        <AppNavbar trainer={trainer} loading={loading} />

        <div className="p-4 flex-1 flex flex-col overflow-hidden min-h-0">
          <Outlet />
        </div>
      </SidebarInset>
    </div>
  )
}
