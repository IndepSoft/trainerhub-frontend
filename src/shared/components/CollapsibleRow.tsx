import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface CollapsibleRowProps {
  title: string
  /** Lo que hay dentro, resumido: lo que evita tener que abrirla. */
  meta?: string
  /** A la derecha, antes de la flecha: una insignia, una cifra. */
  trailing?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

/**
 * Un pliegue con su resumen: una fila de 56 px que se abre.
 *
 * ES EL PATRÓN 3 DE LA PROPUESTA DE VISTAS: lo largo y repetido —las semanas
 * de un plan, los ejercicios de un bloque— se pliega, y la fila cerrada dice lo
 * que hay dentro para que no haga falta abrirla. Las cuatro semanas de un plan
 * eran 28 filas de días seguidas, 1.700 px para decir «lunes, miércoles y
 * viernes».
 *
 * Un `<button>` con `aria-expanded` y no un `<details>`: el marcador del
 * `<summary>` no se deja estilar igual en todos los navegadores, y la fila
 * tiene que medir lo mismo abierta y cerrada. El contenedor del contenido
 * existe siempre —es el destino de `aria-controls`— y sólo se rellena abierto.
 */
export function CollapsibleRow({
  title,
  meta,
  trailing,
  defaultOpen = false,
  children,
  className,
}: CollapsibleRowProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div className={cn('border-b border-cobalt-tint-3', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-14 w-full items-center gap-3 py-2 text-start outline-none focus-visible:ring-2 focus-visible:ring-cobalt/40"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold text-ink">{title}</span>
          {meta !== undefined && <span className="truncate text-xs text-ink/60">{meta}</span>}
        </span>
        {trailing}
        <ChevronDown
          aria-hidden="true"
          className={cn('size-5 shrink-0 text-ink/45 transition-transform', open && 'rotate-180')}
        />
      </button>

      <div id={contentId} hidden={!open} className="pb-3">
        {open && children}
      </div>
    </div>
  )
}
