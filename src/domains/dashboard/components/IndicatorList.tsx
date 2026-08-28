import { IndicatorCard } from '@/shared/components/IndicatorCard'
import type { DashboardIndicator } from '../types/dashboard.types'

interface IndicatorListProps {
  indicators: DashboardIndicator[]
}

export function IndicatorList({ indicators }: IndicatorListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {indicators.map((indicator) => (
        <IndicatorCard
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
