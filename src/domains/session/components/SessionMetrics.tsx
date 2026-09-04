import { formatDistance, formatPace } from '../libs/session.utils'
import type { LiveSessionMetrics } from '../types/session.types'

interface SessionMetricsProps {
  metrics: LiveSessionMetrics
  paceSeconds: number | null
}

interface SecondaryMetric {
  value: string
  label: string
}

/**
 * Las tres métricas secundarias, bajo la duración.
 *
 * Sin tarjetas y sin bordes verticales: sólo espaciado y una regla superior. La
 * jerarquía frente a la duración la marca el tamaño, que es un tercio.
 */
export function SessionMetrics({ metrics, paceSeconds }: SessionMetricsProps) {
  const secondary: SecondaryMetric[] = [
    { value: formatDistance(metrics.distanceMeters), label: 'km' },
    { value: formatPace(paceSeconds), label: 'min/km' },
    { value: String(Math.round(metrics.calories)), label: 'kcal' },
  ]

  return (
    <div className="grid grid-cols-3 border-t border-cobalt-tint-3">
      {secondary.map((metric) => (
        <div key={metric.label} className="flex flex-col items-center gap-1 py-5">
          <span className="metric-figures font-display text-3xl font-extrabold leading-none text-ink">
            {metric.value}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">
            {metric.label}
          </span>
        </div>
      ))}
    </div>
  )
}
