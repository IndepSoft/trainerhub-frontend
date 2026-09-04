import type { ReactNode } from 'react'

interface SectionHeadingProps {
  children: ReactNode
  /** Cifra a la derecha: cuantos elementos hay. Opcional. */
  count?: number
}

/**
 * Encabezado del registro sobrio: mayusculas pequenas muy espaciadas sobre una
 * regla de 1 px. Es el sustituto de `CardHeader`, y ademas es un `<h2>` real,
 * cosa que `CardTitle` no es porque renderiza un `<div>`.
 */
export function SectionHeading({ children, count }: SectionHeadingProps) {
  return (
    <div className="flex items-baseline justify-between border-b border-cobalt-tint-3 pb-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
        {children}
      </h2>
      {count !== undefined && (
        <span className="metric-figures font-display text-lg font-bold leading-none text-cobalt">
          {count}
        </span>
      )}
    </div>
  )
}
