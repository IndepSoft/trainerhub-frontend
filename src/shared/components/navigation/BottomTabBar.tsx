import { NavLink } from 'react-router-dom'
import { getMobileRoutes } from '@/app/config/navigation.config'
import { cn } from '@/shared/lib/utils'
import type { NavigationViewer } from '@/app/config/navigation.config'

/**
 * Navegación principal en móvil.
 *
 * Sustituye al cajón lateral con botón de hamburguesa. Motivo del brief: una
 * PWA instalada se juzga como una app nativa, y en una app nativa los destinos
 * principales están a un toque, no detrás de un menú. El pulgar llega abajo; no
 * llega a la esquina superior izquierda.
 *
 * No va `fixed`: es el último hijo de una columna flex de altura fija, así que
 * ocupa su sitio en el reparto y el contenedor de desplazamiento se encoge
 * solo. Con `fixed` habría que compensar con relleno inferior en cada página y
 * cualquiera que se olvidara dejaría contenido tapado por la barra.
 *
 * `env(safe-area-inset-bottom)` es lo que la separa de la barra de gestos del
 * sistema una vez instalada; funciona porque `index.html` declara
 * `viewport-fit=cover`, sin lo cual el valor sería siempre cero.
 */
interface BottomTabBarProps {
  /** Quien navega. Sin crew sólo se ofrece lo que no pide nada. */
  navigationViewer: NavigationViewer
}

export function BottomTabBar({ navigationViewer }: BottomTabBarProps) {
  const routes = getMobileRoutes(navigationViewer)

  return (
    <nav
      aria-label="Navegación principal"
      className="shrink-0 border-t border-cobalt-tint-3 bg-bone md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex">
        {routes.map((route) => (
          <li key={route.id} className="flex-1">
            <NavLink
              to={route.href}
              // Pide al navegador una transicion de vista en la navegacion.
              // Donde la API no existe, react-router navega igual sin animar.
              viewTransition
              className={({ isActive }) =>
                cn(
                  // 56 px de alto: por encima del objetivo tactil de 44 px que
                  // exige la regla 1.6, con sitio para icono y etiqueta.
                  'relative flex h-14 flex-col items-center justify-center gap-1 px-1 transition-colors',
                  isActive ? 'text-cobalt' : 'text-ink/45'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Indicador superior en vez de fondo relleno: un bloque de
                      color detras del icono compite con el contenido de la
                      pagina, que es lo que la barra debe dejar respirar. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-3 top-0 h-0.5 rounded-full transition-opacity',
                      isActive ? 'bg-cobalt opacity-100' : 'opacity-0'
                    )}
                  />

                  {route.icon && (
                    <route.icon
                      className="size-5 shrink-0"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  )}

                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {route.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
