import { Link, useLocation } from 'react-router-dom'
import { getMobileRoutes, managesWork } from '@/app/config/navigation.config'
import { usePendingWork } from '@/shared/hooks/usePendingWork'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { cn } from '@/shared/lib/utils'
import type { NavigationViewer } from '@/app/config/navigation.config'

/**
 * Si este destino es el que se está mirando.
 *
 * La regla de `NavLink`, escrita: la ruta exacta, o cualquiera por debajo
 * —`/trainings/nueva` sigue siendo Entrenamientos—. Se calcula aquí y no se
 * delega en `NavLink` porque el ANCHO de la pestaña depende de si está activa:
 * la activa lleva etiqueta y se dimensiona por su contenido, y eso se decide en
 * el `<li>`, fuera del alcance del render de `NavLink`.
 */
function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface BottomTabBarProps {
  /** Quien navega. Sin crew sólo se ofrece lo que no pide nada. */
  navigationViewer: NavigationViewer
}

/**
 * Navegación principal en móvil: una píldora que FLOTA sobre el contenido.
 *
 * Sustituye al cajón lateral con botón de hamburguesa. Motivo del brief: una
 * PWA instalada se juzga como una app nativa, y en una app nativa los destinos
 * principales están a un toque, no detrás de un menú. El pulgar llega abajo; no
 * llega a la esquina superior izquierda.
 *
 * FLOTA, Y ANTES OCUPABA SITIO. Pegada al borde, la barra se comía 56 px de
 * todas las pantallas y partía la página con una línea de lado a lado; flotando,
 * el contenido pasa por debajo y la aplicación se lee de borde a borde. Es la
 * variante C de `docs/design/barra/`, decidida en `CAMBIOS` §36 tras comparar
 * cinco.
 *
 * CINCO ETIQUETAS NO CABEN EN UNA PÍLDORA, y está medido: «ENTRENAMIENTOS» mide
 * 86 px y a 375 px la píldora tiene 343 de interior. Por eso la etiqueta la
 * lleva SÓLO la activa, dentro de su cápsula, y las demás son icono. El nombre
 * no se pierde para quien no ve la pantalla: va en `aria-label` de cada enlace,
 * que además es como lo encuentran las pruebas.
 *
 * EL HUECO PARA QUE NO TAPE NADA NO SE PONE AQUÍ. Lo hereda cada página de
 * `--bottom-bar-space`, que fija `RootLayout`. Es lo que advertía el comentario
 * de la versión anterior —«cualquiera que se olvidara dejaría contenido
 * tapado»—, y por eso se resuelve en un sitio y no página a página.
 *
 * `env(safe-area-inset-bottom)` es lo que la separa de la barra de gestos del
 * sistema una vez instalada; funciona porque `index.html` declara
 * `viewport-fit=cover`, sin lo cual el valor sería siempre cero.
 */
export function BottomTabBar({ navigationViewer }: BottomTabBarProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const routes = getMobileRoutes(navigationViewer)
  const pending = usePendingWork(managesWork(navigationViewer))

  return (
    <>
      {/*
        El degradado a Bone bajo la píldora. Sin él, la última fila de una lista
        queda medio tapada y no se sabe si hay más: con él, se desvanece y se
        lee entera al llegar al final. `pointer-events-none` porque es pintura,
        no superficie: un toque ahí tiene que llegar a la lista.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-t from-bone from-[35%] to-transparent md:hidden"
      />

      <nav
        aria-label={t('nav.main')}
        className="absolute inset-x-3 md:hidden"
        // En `style` y no en clases: `bottom` tiene que sumar el margen fijo y
        // el alto variable de la zona segura, y eso es una sola declaración.
        style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <ul className="flex items-center rounded-action border border-cobalt-tint-3 bg-surface px-1 shadow-[0_8px_24px_rgba(10,18,36,0.12)]">
          {routes.map((route) => {
            const isActive = isCurrent(pathname, route.href)

            return (
              <li
                key={route.id}
                className={cn(
                  'flex justify-center',
                  // La activa se dimensiona por su contenido —lleva etiqueta— y
                  // las demás se reparten lo que queda. Con todas a `flex-1`, la
                  // etiqueta de la activa no cabría en su quinto de píldora.
                  isActive ? 'flex-[1_0_auto]' : 'flex-1'
                )}
              >
                <Link
                  to={route.href}
                  aria-label={t(route.labelKey)}
                  aria-current={isActive ? 'page' : undefined}
                  // Pide al navegador una transicion de vista en la navegacion.
                  // Donde la API no existe, react-router navega igual sin animar.
                  viewTransition
                  className={cn(
                    // 56 px de alto: por encima del objetivo tactil de 44 px que
                    // exige la regla 1.6.
                    'flex h-14 items-center justify-center px-0.5 transition-colors',
                    isActive ? 'text-cobalt' : 'text-ink/45'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 items-center justify-center gap-1.5 rounded-action px-3',
                      isActive && 'bg-cobalt-tint-2'
                    )}
                  >
                    {route.icon && (
                      <span className="relative flex">
                        <route.icon
                          className="size-5 shrink-0"
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        {route.id === 'dashboard' && pending.total > 0 && (
                          <span
                            aria-label={t('nav.pendingLabel', { count: pending.total })}
                            className="metric-figures absolute -end-2.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[9px] font-bold leading-4 text-white"
                          >
                            {pending.total > 9 ? '9+' : pending.total}
                          </span>
                        )}
                      </span>
                    )}

                    {/* Sólo en la activa: ver la cabecera del componente. */}
                    {isActive && (
                      <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider">
                        {t(route.labelKey)}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
