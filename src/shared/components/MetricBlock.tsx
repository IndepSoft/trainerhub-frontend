import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type MetricPeriod = 'week' | 'month' | 'year'
export type MetricTrend = 'up' | 'down' | 'same'

export interface MetricBlockProps {
  title: string
  indicator: number | string
  icon: LucideIcon
  prefix?: string
  suffix?: string
  /**
   * La tendencia es opcional: hay metricas que no la tienen -«Logros activos»
   * no se compara con nada-. Sin ella se omite la linea inferior en vez de
   * pintar un cero enganoso, y no hace falta un segundo componente.
   */
  period?: MetricPeriod
  delta?: number
  deltaType?: MetricTrend
}

const PERIOD_LABELS: Record<MetricPeriod, string> = {
  week: 'vs. semana pasada',
  month: 'vs. mes pasado',
  year: 'vs. año pasado',
}

const TREND_SIGNS: Record<MetricTrend, string> = {
  up: '+',
  down: '−',
  same: '',
}

/**
 * La tendencia usa la escala semantica, no la marca. Un delta al alza no es
 * «accion primaria»: es un dato bueno. Pintarlo de Cobalt confundiria el
 * significado del azul, que en este sistema es estructura.
 */
const TREND_COLORS: Record<MetricTrend, string> = {
  up: 'text-success',
  down: 'text-destructive',
  same: 'text-ink/40',
}

/**
 * Metrica del registro sobrio.
 *
 * Deliberadamente NO es una tarjeta: sin borde, sin sombra y sin radio. La
 * jerarquia la da el tamano de la cifra y una regla de 1 px, que es el elemento
 * firma de esta seccion. Encerrar cada dato en su caja es el patron por defecto
 * que el rediseno evita.
 */
export function MetricBlock({
  title,
  indicator,
  icon: Icon,
  delta,
  prefix = '',
  suffix = '',
  deltaType,
  period,
}: MetricBlockProps) {
  const hasTrend = deltaType !== undefined && delta !== undefined && period !== undefined

  return (
    <div className="flex flex-col gap-3 py-6 px-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          {title}
        </span>
        <Icon className="size-4 shrink-0 text-cobalt" strokeWidth={2.25} />
      </div>

      <p className="metric-figures font-display text-5xl font-extrabold leading-none text-ink">
        {prefix}
        {typeof indicator === 'number' ? indicator.toLocaleString('es') : indicator}
        <span className="ml-1 text-2xl font-bold text-ink/45">{suffix}</span>
      </p>

      {hasTrend && (
        <p className="flex items-baseline gap-1.5 text-xs">
          <span className={cn('metric-figures font-semibold', TREND_COLORS[deltaType])}>
            {TREND_SIGNS[deltaType]}
            {prefix}
            {delta}
            {suffix}
          </span>
          <span className="text-ink/40">{PERIOD_LABELS[period]}</span>
        </p>
      )}
    </div>
  )
}
