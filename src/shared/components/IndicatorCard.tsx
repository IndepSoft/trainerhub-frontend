import { Card, CardContent, CardFooter, CardTitle } from '@/shared/ui/card'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type IndicatorPeriod = 'week' | 'month' | 'year'
export type IndicatorTrend = 'up' | 'down' | 'same'

export interface IndicatorCardProps {
  title: string
  indicator: number
  icon: LucideIcon
  period: IndicatorPeriod
  delta: number
  prefix?: string
  suffix?: string
  deltaType: IndicatorTrend
}

/**
 * Etiquetas del periodo comparado. Fuera del componente porque son datos, no
 * pintura: si manana hay que traducirlas o anadir 'quarter', se toca esta tabla
 * y el componente no se entera.
 */
const PERIOD_LABELS: Record<IndicatorPeriod, string> = {
  week: 'desde la semana pasada',
  month: 'desde el mes pasado',
  year: 'desde el año pasado',
}

const TREND_SIGNS: Record<IndicatorTrend, string> = {
  up: '+',
  down: '-',
  same: '',
}

/**
 * El color sigue a la tendencia. Antes estaba fijo en verde, asi que una caida
 * se pintaba como si fuera una mejora.
 */
const TREND_COLORS: Record<IndicatorTrend, string> = {
  up: 'text-green-700',
  down: 'text-red-700',
  same: 'text-muted-foreground',
}

export function IndicatorCard({
  title,
  indicator,
  icon: Icon,
  delta,
  prefix = '',
  suffix = '',
  deltaType,
  period,
}: IndicatorCardProps) {
  return (
    <Card className="h-full bg-gray-50">
      <CardContent className="pt-4 pb-2 flex justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-muted-foreground">{title}</CardTitle>
          <p className="font-bold text-3xl">
            {prefix} {indicator} {suffix}
          </p>
        </div>
        <div className="flex items-center">
          <Icon className="size-4 shrink-0" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-1 items-center">
          <span className={cn('font-bold text-base', TREND_COLORS[deltaType])}>
            {TREND_SIGNS[deltaType]}
            {prefix}
            {delta}
            {suffix}
          </span>
          <p className="text-sm">{PERIOD_LABELS[period]}</p>
        </div>
      </CardFooter>
    </Card>
  )
}
