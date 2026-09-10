import { RouteNode } from './RouteNode'
import { ROUTE_DESCRIPTION_KEY, ROUTE_NAME_KEY } from '../libs/routePath'
import type { ProgressRouteCode } from '@/shared/domain/entities/progress'
import type { PathNode } from '../types/gamification.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface RoutePathProps {
  route: ProgressRouteCode
  nodes: PathNode[]
}

/**
 * La ruta de desarrollo, como sendero de cuatro nodos.
 *
 * Sustituye a la escalera fija de sesiones: lo que se recorre ahora depende
 * del objetivo del plan y lo abre el entrenador, no un contador.
 */
export function RoutePath({ route, nodes }: RoutePathProps) {
  const { t } = useTranslation()
  return (
    // Ancho acotado: un sendero es una lectura vertical. Estirado a lo ancho
    // de una pantalla de escritorio, las barras de progreso pasan de 250 a
    // 1000 px y dejan de leerse como una barra.
    <section className="mx-auto w-full max-w-2xl px-5 py-6" aria-labelledby="ruta-titulo">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ruta-titulo" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/50">
          {t('progress.path')}
        </h2>
        <p className="font-display text-lg font-extrabold uppercase tracking-tight text-ink">
          {t('route.label', { route: t(ROUTE_NAME_KEY[route]) })}
        </p>
      </div>
      <p className="mb-6 text-sm text-ink/55">{t(ROUTE_DESCRIPTION_KEY[route])}</p>

      <ol className="relative">
        {nodes.map((node, index) => (
          <RouteNode
            key={node.position}
            node={node}
            isLast={index === nodes.length - 1}
            leadsToLocked={nodes[index + 1]?.state === 'locked'}
          />
        ))}
      </ol>
    </section>
  )
}
