import { Card, CardContent, CardFooter, CardTitle } from '@/shared/ui/card'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface IIndicatorCardProps {
  title: string
  indicator: number
  icon: LucideIcon
  period: 'week' | 'month' | 'year'
  delta: number
  prefix?: string
  sufix?: string
  deltaType: 'up' | 'down' | 'same'
}

export default function IndicatorCardComponent({
  title,
  indicator,
  icon: Icon,
  delta,
  prefix = '',
  sufix = '',
  deltaType,
  period,
}: IIndicatorCardProps) {
  return (
    <Card className="flex-1 bg-gray-50">
      <CardContent className="pt-4 pb-2 flex justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-muted-foreground">{title}</CardTitle>
          <p className="font-bold text-3xl">
            {prefix} {indicator} {sufix}
          </p>
        </div>
        <div className="flex items-center">
          <Icon className={cn('size-4 shrink-0')} />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-1 items-center">
          <span className="text-green-700 font-bold text-base ">
            {deltaType === 'up' ? '+' : deltaType === 'down' ? '-' : ''}
            {prefix}
            {delta}
            {sufix}
          </span>
          <p className="text-sm">
            desde{' '}
            {period === 'week'
              ? 'la semana pasada'
              : period === 'month'
                ? 'el mes pasado'
                : 'el año pasado'}
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
