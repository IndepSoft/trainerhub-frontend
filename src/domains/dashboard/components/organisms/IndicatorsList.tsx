import { useEffect, useState } from 'react'
import IndicatorCardComponent, { type IIndicatorCardProps } from '@/shared/components/card-custom/IndicatorCardComponent'
import {
  BanknoteArrowUp,
  BicepsFlexed,
  CalendarDays,
  Users,
} from 'lucide-react'

export default function IndicatorsList() {
  const [indicators, setIndicators] = useState<IIndicatorCardProps[]>([])

  useEffect(() => {
    setIndicators([
      {
        title: 'Estudiantes Activos',
        indicator: 2,
        icon: Users,
        delta: 5,
        deltaType: 'up',
        period: 'month',
      },
      {
        title: 'Sesiones Esta Semana',
        indicator: 8,
        icon: CalendarDays,
        delta: 2,
        deltaType: 'up',
        period: 'week',
      },
      {
        title: 'Ingresos del Mes',
        indicator: 500,
        icon: BanknoteArrowUp,
        delta: 200,
        prefix: 'S/',
        deltaType: 'up',
        period: 'month',
      },
      {
        title: 'Rutinas Creadas',
        indicator: 12,
        icon: BicepsFlexed,
        delta: 3,
        deltaType: 'up',
        period: 'month',
      },
    ])
  }, [])

  return (
    <div className="flex gap-4">
      {indicators.map((indicator, i) => (
        <IndicatorCardComponent
          key={i}
          title={indicator.title}
          delta={indicator.delta}
          deltaType={indicator.deltaType}
          prefix={indicator.prefix}
          icon={indicator.icon}
          indicator={indicator.indicator}
          period={indicator.period}
        ></IndicatorCardComponent>
      ))}
    </div>
  )
}
