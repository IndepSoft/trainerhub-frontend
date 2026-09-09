import { Link, useNavigate } from 'react-router-dom'
import { useViewerContext } from '@/app/ViewerContext'
import { Check, ChevronsUpDown, Plus, Users } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'
import { ROLE_LABEL_KEY } from '@/shared/i18n/domainLabels'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useWallUnread } from '@/shared/hooks/useWallUnread'
import type { Membership } from '@/shared/domain/entities/crew'

interface CrewSwitcherProps {
  memberships: Membership[]
  active: Membership | null
  loading: boolean
  onSelect: (crewId: string) => void
}

/**
 * El crew activo, en la cabecera de la barra lateral.
 *
 * OCUPA EL SITIO DEL NOMBRE DEL ENTRENADOR, y el cambio es de fondo, no de
 * adorno: ese hueco es el que dice «dónde estoy», y desde que los datos
 * pertenecen a un crew, dónde estoy es en QUÉ CREW estoy. Quién soy sigue
 * estando a un toque, en el menú de usuario de la barra superior. Es el reparto
 * que hacen las herramientas con espacios de trabajo, y funciona porque
 * responden a preguntas distintas.
 *
 * Sin ningún crew no se esconde: dice que no hay y ofrece la entrada para
 * unirse. Un hueco vacío ahí se lee como que algo falla.
 */
export function CrewSwitcher({ memberships, active, loading, onSelect }: CrewSwitcherProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { trainer } = useViewerContext()
  // Antes de los retornos tempranos: los hooks se llaman siempre en el mismo orden.
  const unread = useWallUnread(active?.crew.id ?? null)

  if (loading) return <CrewSwitcherSkeleton />

  if (active === null) {
    /*
     * Sin equipo, la puerta depende de quien mira: quien tiene ficha de
     * entrenador crea el suyo; quien no, se une con un codigo. Antes solo
     * habia «unete», y un entrenador recien registrado no encontraba como
     * fundar su equipo desde la barra.
     */
    return (
      <Link
        to={trainer !== null ? '/crew/nuevo' : '/crew/unirse'}
        className="flex min-h-11 items-center gap-3 rounded-action text-start transition-colors hover:text-cobalt"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-action border border-dashed border-cobalt-tint-3 text-ink/30">
          <Users className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">{t('crewSwitcher.noCrew')}</span>
          <span className="block text-xs text-ink/45">
            {trainer !== null ? t('crewSwitcher.createToStart') : t('crewSwitcher.joinToStart')}
          </span>
        </span>
      </Link>
    )
  }

  const { crew } = active

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-h-11 w-full items-center gap-3 rounded-action text-start transition-colors hover:text-cobalt">
        <span className="relative shrink-0">
          <CrewBadge name={crew.name} photoUrl={crew.photoUrl} />
          {/* Anuncios sin leer, sobre la insignia del equipo: es la entrada
              al muro, y el sitio que la deuda pedia para el contador. */}
          {unread > 0 && (
            <span
              aria-label={t('crewSwitcher.unread', { count: unread })}
              className="metric-figures absolute -end-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold leading-5 text-white"
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{crew.name}</span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
            {/* La denominación que eligió su entrenador: «tribu», «box»… */}
            {crew.denomination}
            {/* El papel, salvo el de entrenador: es el corriente y decirlo en
                cada pantalla es ruido. Administrador y alumno sí, porque
                cambian lo que se puede hacer. */}
            {active.role === 'trainer' ? '' : ` · ${t(ROLE_LABEL_KEY[active.role])}`}
          </span>
        </span>

        <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-ink/30" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuItem onSelect={() => navigate('/crew')}>
          <Users className="me-2 size-4" />
          {t('crewSwitcher.viewCrew')}
        </DropdownMenuItem>

        {memberships.length > 1 && (
          <>
            <DropdownMenuSeparator />
            {memberships.map((membership) => (
              <DropdownMenuItem
                key={membership.crew.id}
                onSelect={() => onSelect(membership.crew.id)}
              >
                <Check
                  aria-hidden="true"
                  className={cn(
                    'me-2 size-4',
                    // Se reserva el hueco siempre, marcado o no: sin él, los
                    // nombres bailan al cambiar de crew.
                    membership.crew.id === crew.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="truncate">{membership.crew.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/crew/unirse')}>
          <Plus className="me-2 size-4" />
          {t('crewSwitcher.joinAnother')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface CrewBadgeProps {
  name: string
  photoUrl?: string
}

/** La marca del crew: su foto, o sus iniciales sobre el tinte del sistema. */
function CrewBadge({ name, photoUrl }: CrewBadgeProps) {
  if (photoUrl !== undefined) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="size-9 shrink-0 rounded-action object-cover"
      />
    )
  }

  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-action bg-cobalt text-xs font-bold uppercase text-white">
      {crewInitials(name)}
    </span>
  )
}

/**
 * Hasta dos iniciales del nombre del crew.
 *
 * No se reutiliza `getInitials` de `personName`: aquello espera nombre y
 * apellido por separado, y un crew tiene un nombre suelto que puede ser de una
 * palabra o de cuatro.
 */
function crewInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '·'
  if (words.length === 1) return words[0].slice(0, 2)
  return `${words[0][0]}${words[1][0]}`
}

function CrewSwitcherSkeleton() {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <div className="size-9 shrink-0 animate-pulse rounded-action bg-cobalt-tint-2" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3.5 w-28 animate-pulse rounded bg-cobalt-tint-2" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-cobalt-tint-2" />
      </div>
    </div>
  )
}
