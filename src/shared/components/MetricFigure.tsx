interface MetricFigureProps {
  label: string
  /** `null` mientras carga o si no hay dato: se pinta un guion, no un cero. */
  value: number | string | null
  /** La unidad, o lo que matiza la cifra: «min», «en total», «/sem». */
  unit?: string
}

/**
 * Una cifra de ficha, dentro de una `MetricStrip`.
 *
 * MÁS PEQUEÑA QUE `MetricBlock`, a propósito. `MetricBlock` es el indicador de
 * una pantalla de gestión —el panel, los reportes—, con icono y tendencia.
 * Esto son los datos de UN objeto —una persona, una rutina, un plan— y van
 * cuatro en una franja de dos por dos: sin icono, porque la etiqueta ya dice
 * lo que es, y con la cifra a 26 px para que las cuatro quepan sin empujar el
 * contenido que viene debajo.
 *
 * La cifra puede ser texto —«Principiante»—, y por eso se trunca: en otro
 * idioma el nivel es más largo y la celda no puede crecer.
 */
export function MetricFigure({ label, value, unit }: MetricFigureProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-bone px-4 py-3 sm:px-5 sm:py-4">
      <dt className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/60">
        {label}
      </dt>
      <dd className="metric-figures truncate font-display text-[1.625rem] font-extrabold leading-none text-ink">
        {value ?? '—'}
        {unit !== undefined && (
          <span className="ml-1 font-sans text-xs font-medium text-ink/45">{unit}</span>
        )}
      </dd>
    </div>
  )
}
