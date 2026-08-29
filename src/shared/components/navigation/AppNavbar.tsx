import { SidebarTrigger } from '@/shared/ui/sidebar'
import { UserMenu } from './UserMenu'
import { NotificationButton } from './NotificationButton'
import type { Trainer } from '@/shared/domain/entities/trainer'

interface AppNavbarProps {
  trainer: Trainer | null
  loading: boolean
}

/**
 * Barra superior.
 *
 * Ya no lleva navegación: en escritorio la da la barra lateral y en móvil la
 * barra inferior. Antes tenía una lista horizontal alimentada por
 * `getNavbarRoutes()`, que devolvía siempre una lista vacía porque
 * `showInNavbar` era `false` en los nueve elementos de la configuración. Nunca
 * pintó nada.
 *
 * El botón de hamburguesa tampoco está: los destinos principales viven ahora en
 * la barra inferior, a un toque y al alcance del pulgar.
 */
export function AppNavbar({ trainer, loading }: AppNavbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-cobalt-tint-3 px-4">
      <SidebarTrigger className="hidden md:flex" />

      {/* En movil no hay disparador de barra lateral, asi que este hueco
          mantiene el menu de usuario a la derecha. */}
      <span className="md:hidden" />

      <div className="flex items-center gap-2">
        <NotificationButton />
        <UserMenu trainer={trainer} loading={loading} />
      </div>
    </header>
  )
}
