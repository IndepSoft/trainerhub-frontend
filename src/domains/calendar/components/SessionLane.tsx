import { TIME_SLOTS } from '../data/calendarOptions'
import { placeSessions } from '../libs/sessionLayout'
import { cn } from '@/shared/lib/utils'
import type { Session } from '../types/calendar.types'
import type { ReactNode } from 'react'

interface SessionLaneProps {
  sessions: Session[]
  /** Alto de cada tramo en píxeles. Fija la escala de toda la columna. */
  slotHeight: number
  /** Pinta una sesión ya colocada. Cada vista decide su propia tarjeta. */
  renderSession: (session: Session, isCompact: boolean) => ReactNode
  /** Debajo de este alto, la tarjeta no cabe entera y se pinta en versión mínima. */
  compactBelowPx?: number
  className?: string
}

/**
 * Columna de un día con sus sesiones colocadas sobre la escala.
 *
 * Una sesión ya no «pertenece» a un tramo: se posiciona por su hora de inicio y
 * se dimensiona por su duración, así que una de 06:15 a 08:20 cruza todos los
 * tramos que ocupa en vez de pintarse en uno solo. Antes el índice era
 * `fecha|hora` y eso obligaba a que empezara justo en un tramo; una sesión de
 * 60 minutos se dibujaba con el tamaño de una de 30.
 *
 * Las líneas de tramo son el fondo, no contenedores: las sesiones flotan encima
 * con posición absoluta, que es lo que permite que crucen.
 */
export function SessionLane({
  sessions,
  slotHeight,
  renderSession,
  compactBelowPx = 56,
  className,
}: SessionLaneProps) {
  const placed = placeSessions(sessions)
  const totalHeight = TIME_SLOTS.length * slotHeight

  return (
    <div
      className={cn('relative', className)}
      style={{ height: totalHeight }}
    >
      {/* Rejilla de fondo: una línea por tramo. Es la escala sobre la que se
          leen las sesiones, y por eso se dibuja aunque no haya ninguna. */}
      {TIME_SLOTS.map((time, index) => (
        <div
          key={time}
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 border-t',
            // La línea de la hora en punto marca más que la de la media: sin esa
            // jerarquía, veintisiete líneas iguales no dejan contar las horas.
            time.endsWith(':00') ? 'border-cobalt-tint-3' : 'border-cobalt-tint-2'
          )}
          style={{ top: index * slotHeight }}
        />
      ))}

      {placed.map(({ session, placement }) => {
        const heightPx = placement.heightRatio * totalHeight
        return (
          <div
            key={session.id}
            className="absolute px-0.5"
            style={{
              top: placement.topRatio * totalHeight,
              height: heightPx,
              // El reparto en columnas sólo se nota cuando hay solape; con una
              // sola sesión, `laneCount` es 1 y ocupa el ancho completo.
              left: `${(placement.laneIndex / placement.laneCount) * 100}%`,
              width: `${100 / placement.laneCount}%`,
            }}
          >
            {renderSession(session, heightPx < compactBelowPx)}
          </div>
        )
      })}
    </div>
  )
}
