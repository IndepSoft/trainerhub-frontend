import { MetricBlock } from '@/shared/components/MetricBlock'
import { MetricStrip } from '@/shared/components/MetricStrip'
import { closesRowAlone } from '@/shared/lib/metricRows'
import type { DashboardIndicator } from '../types/dashboard.types'

interface IndicatorListProps {
  indicators: DashboardIndicator[]
}

/**
 * Las cifras del panel, en la franja de dos columnas de `MetricStrip`. Con un
 * número impar la última queda sola en su fila, y en móvil se tiende a lo
 * ancho en vez de dejar medio hueco vacío al lado.
 */
export function IndicatorList({ indicators }: IndicatorListProps) {
  return (
    <MetricStrip columns={3}>
      {indicators.map((indicator, index) => (
        <MetricBlock
          key={indicator.id}
          title={indicator.title}
          indicator={indicator.indicator}
          icon={indicator.icon}
          period={indicator.period}
          delta={indicator.delta}
          deltaType={indicator.deltaType}
          prefix={indicator.prefix}
          mobileLayout={closesRowAlone(index, indicators.length) ? 'wide' : 'stacked'}
        />
      ))}
    </MetricStrip>
  )
}
