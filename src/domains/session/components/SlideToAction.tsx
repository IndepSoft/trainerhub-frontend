import { ChevronRight } from 'lucide-react'
import { useSlideToConfirm } from '@/shared/hooks/useSlideToConfirm'
import { cn } from '@/shared/lib/utils'

interface SlideToActionProps {
  label: string
  onConfirm: () => void
  /** Etiqueta del botón accesible equivalente, para teclado y lectores de pantalla. */
  accessibleLabel: string
  /**
   * `pause` es la acción reversible y va en Cobalt; `finish` es irreversible y
   * va en Ink, más sobria, para que no compita con la principal ni invite a
   * pulsarla por reflejo.
   */
  variant?: 'pause' | 'finish'
}

/**
 * Franja inferior de acción única.
 *
 * El gesto vive en `useSlideToConfirm`; aquí sólo se pinta. La franja sangra a
 * los bordes y va en Cobalt sólido: es el bloque de color que ancla la pantalla
 * y equilibra el peso del naranja, que se reduce a un punto en el mapa.
 *
 * Accesibilidad: además del arrastre hay un `<button>` real. Un gesto de
 * deslizamiento no es alcanzable con teclado, así que sin este botón la acción
 * sería imposible sin ratón o dedo.
 */
export function SlideToAction({
  label,
  onConfirm,
  accessibleLabel,
  variant = 'pause',
}: SlideToActionProps) {
  const { progress, isDragging, handlers } = useSlideToConfirm({ onConfirm })

  return (
    <div
      className={cn(
        'relative shrink-0 select-none overflow-hidden touch-none',
        variant === 'finish' ? 'bg-ink' : 'bg-cobalt'
      )}
      {...handlers}
    >
      {/* Estela del arrastre: aclara lo ya recorrido. */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0',
          variant === 'finish' ? 'bg-ember' : 'bg-cobalt-lift',
          !isDragging && 'transition-[width] duration-300 ease-out'
        )}
        style={{ width: `${progress * 100}%` }}
      />

      <div className="relative flex items-center gap-3 px-5 py-5">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-action bg-white/15',
            !isDragging && 'transition-transform duration-300 ease-out'
          )}
          style={{ transform: `translateX(${progress * 180}%)` }}
        >
          <ChevronRight className="size-5 text-white" strokeWidth={2.5} />
        </span>

        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 text-left text-sm font-semibold uppercase tracking-[0.18em] text-white"
        >
          <span aria-hidden="true">{label}</span>
          <span className="sr-only">{accessibleLabel}</span>
        </button>
      </div>
    </div>
  )
}
