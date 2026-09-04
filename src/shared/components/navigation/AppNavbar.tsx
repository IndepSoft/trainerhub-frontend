import { SidebarTrigger } from '@/shared/ui/sidebar'
import { UserMenu } from './UserMenu'
import { CrewSwitcher } from './CrewSwitcher'
import { NotificationButton } from './NotificationButton'
import type { Membership } from '@/shared/domain/entities/crew'

interface AppNavbarProps {
  person: { firstName?: string; lastName?: string; photoUrl?: string }
  memberships: Membership[]
  active: Membership | null
  loading: boolean
  onSelectCrew: (crewId: string) => void
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
 *
 * EL CREW SÍ ESTÁ, Y SÓLO EN MÓVIL. En escritorio vive en la cabecera de la
 * barra lateral, pero en móvil esa barra no se abre —no hay disparador, a
 * propósito—, así que sin esto no habría forma de saber en qué equipo se está ni
 * de cambiar de uno a otro desde un teléfono. El hueco de la izquierda estaba
 * ocupado por un separador vacío.
 */
export function AppNavbar({
  person,
  memberships,
  active,
  loading,
  onSelectCrew,
}: AppNavbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-cobalt-tint-3 px-4">
      <SidebarTrigger className="hidden md:flex" />

      <div className="min-w-0 flex-1 md:hidden">
        <CrewSwitcher
          memberships={memberships}
          active={active}
          loading={loading}
          onSelect={onSelectCrew}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationButton />
        <UserMenu person={person} loading={loading} />
      </div>
    </header>
  )
}
