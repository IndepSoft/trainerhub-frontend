import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from '@/shared/components/navigation/AppSidebar'
import { AppNavbar } from '@/shared/components/navigation/AppNavbar'
import { BottomTabBar } from '@/shared/components/navigation/BottomTabBar'
import { SidebarInset } from '@/shared/ui/sidebar'
import { useAuth } from '@/auth/hooks/useAuth'
import { useTrainer } from '@/app/hooks/useTrainer'
import { hasSeenOnboarding } from '@/domains/onboarding/hooks/useOnboarding'

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
   * Rutas a pantalla completa, sin barra lateral, superior ni inferior.
   *
   * - La celebracion, porque el registro agresivo depende de ocupar la pantalla
   *   entera: con la navegacion alrededor, el bloque diagonal se lee como un
   *   banner dentro de la aplicacion y no como un momento.
   * - La sesion en vivo, por dos razones. Medida: a 375 px su contenido son
   *   615 px en un hueco de 511, asi que habia que desplazarse para ver el
   *   cronometro, que es el motivo entero de la pantalla. Quitar las barras
   *   superior e inferior devuelve unos 120 px y cabe. Y de producto: una
   *   sesion en marcha es un modo enfocado; ofrecer la navegacion completa
   *   invita a salirse por error de algo que esta corriendo.
   */
  const hideNavRoutes = [
    '/authentication',
    '/progress/celebracion',
    '/session',
    '/onboarding',
  ]
  const shouldHideNav = hideNavRoutes.includes(location.pathname)

  /*
   * El onboarding se muestra una vez, en la primera sesion del dispositivo. Se
   * decide aqui porque RootLayout es el unico punto por el que pasan todas las
   * rutas autenticadas; ponerlo en cada pagina seria repetirlo seis veces.
   *
   * La guardia NO se aplica en `/authentication`, y el motivo no es teorico:
   * `useLogin` hace `setUser` y despues `navigate('/dashboard')`. Entre esas dos
   * lineas hay un renderizado en el que ya hay usuario pero la ruta sigue siendo
   * `/authentication`; sin esta exclusion la guardia disparaba ahi, el
   * `navigate` posterior la deshacia, y las dos navegaciones se pisaban en
   * bucle dejando la pantalla en blanco.
   *
   * `replace` a proposito: sin el, el boton de atras devolveria al onboarding
   * ya completado.
   */
  const rutasSinGuardiaDeOnboarding = ['/authentication', '/onboarding']
  const necesitaOnboarding =
    user !== null &&
    !rutasSinGuardiaDeOnboarding.includes(location.pathname) &&
    !hasSeenOnboarding()

  if (necesitaOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  if (shouldHideNav) {
    // Columna flex y no un div suelto: las paginas a pantalla completa declaran
    // `flex-1` en su raiz, que sin un padre flex no reparte nada.
    return (
      <div className="flex h-dvh w-dvw flex-col overflow-hidden">
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

        {/* Ultimo hijo de la columna y no `fixed`: asi ocupa su sitio en el
            reparto flex y el contenedor de desplazamiento se encoge solo. Con
            `fixed` habria que compensar con relleno inferior en cada pagina, y
            cualquiera que se olvidara dejaria contenido tapado. */}
        <BottomTabBar />
      </SidebarInset>
    </div>
  )
}
