import { MetricBlock } from '@/shared/components/MetricBlock'
import type { DashboardIndicator } from '../types/dashboard.types'

interface IndicatorListProps {
  indicators: DashboardIndicator[]
}

/**
 * Rejilla de metricas separadas por reglas de 1 px, no por bordes de tarjeta.
 *
 * El truco es `-mx-px` sobre `divide-*`: la rejilla dibuja una sola linea
 * compartida entre celdas contiguas en vez de dos bordes pegados, que es lo que
 * produce el aspecto de «cajas apiladas».
 */
export function IndicatorList({ indicators }: IndicatorListProps) {
  return (
    <div className="grid grid-cols-1 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
      {indicators.map((indicator) => (
        <MetricBlock
          key={indicator.id}
          title={indicator.title}
          indicator={indicator.indicator}
          icon={indicator.icon}
          period={indicator.period}
          delta={indicator.delta}
          deltaType={indicator.deltaType}
          prefix={indicator.prefix}
        />
      ))}
    </div>
  )
}
