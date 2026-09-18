import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { activeLocale } from '@/shared/i18n/activeLocale'

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
  /**
   * `wide` para la métrica que en móvil cierra sola la última fila de una
   * `MetricStrip` de dos columnas: abarca las dos y se tiende en horizontal
   * —icono y etiqueta a la izquierda, cifra a la derecha— para que una celda
   * a todo el ancho no sea un bloque de 90 px con la cifra sola. Desde `sm`
   * vuelve a ser una celda como las demás.
   */
  mobileLayout?: 'stacked' | 'wide'
}

const PERIOD_LABEL_KEY: Record<MetricPeriod, TranslationKey> = {
  week: 'metric.vsWeek',
  month: 'metric.vsMonth',
  year: 'metric.vsYear',
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
  same: 'text-ink/60',
}

/**
 * Metrica del registro sobrio. Va dentro de una `MetricStrip`, que es una
 * `<dl>`: la celda es el `div` que agrupa el termino y su definicion.
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
  mobileLayout = 'stacked',
}: MetricBlockProps) {
  const { t } = useTranslation()
  const hasTrend = deltaType !== undefined && delta !== undefined && period !== undefined
  const isWide = mobileLayout === 'wide'

  /*
   * `bg-bone` no es decorativo: `MetricStrip` pinta las reglas con el fondo
   * del contenedor, y la celda tiene que taparlo. Relleno menor en movil,
   * donde la celda mide la mitad; el de siempre desde `sm`.
   */
  return (
    <div
      className={cn(
        'flex flex-col gap-2 bg-bone px-4 py-4 sm:gap-3 sm:px-5 sm:py-6',
        isWide &&
          'col-span-2 flex-row items-center justify-between gap-3 py-3 sm:col-span-1 sm:flex-col sm:items-stretch'
      )}
    >
      <dt
        className={cn(
          'flex items-start justify-between gap-3',
          isWide && 'flex-row-reverse items-center justify-end gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3'
        )}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
          {title}
        </span>
        <Icon className="size-4 shrink-0 text-cobalt" strokeWidth={2.25} />
      </dt>

      <dd className={cn('flex flex-col gap-2 sm:gap-3', isWide && 'items-end sm:items-stretch')}>
        <p
          className={cn(
            'metric-figures font-display text-4xl font-extrabold leading-none text-ink sm:text-5xl',
            isWide && 'text-3xl'
          )}
        >
          {prefix}
          {typeof indicator === 'number' ? indicator.toLocaleString(activeLocale()) : indicator}
          <span className="ml-1 text-xl font-bold text-ink/60 sm:text-2xl">{suffix}</span>
        </p>

        {hasTrend && (
          <p className="flex items-baseline gap-1.5 text-xs">
            <span className={cn('metric-figures font-semibold', TREND_COLORS[deltaType])}>
              {TREND_SIGNS[deltaType]}
              {prefix}
              {delta}
              {suffix}
            </span>
            <span className="text-ink/60">{t(PERIOD_LABEL_KEY[period])}</span>
          </p>
        )}
      </dd>
    </div>
  )
}
