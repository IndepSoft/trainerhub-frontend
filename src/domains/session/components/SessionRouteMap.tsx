import { useMemo } from 'react'
import { normalizeRoute, splitRouteAtProgress, toSvgPath } from '../libs/session.utils'
import type { RoutePoint } from '../types/session.types'

interface SessionRouteMapProps {
  route: RoutePoint[]
  /** Fracción recorrida, de 0 a 1. */
  progress: number
}

/**
 * Trazado de la sesión.
 *
 * Es un SVG propio y no un mapa embebido a propósito: el azul de serie de Google
 * Maps compite con Cobalt y rompe el sistema de color, además de exigir red en
 * una aplicación que debe funcionar sin conexión. Cuando haga falta cartografía
 * real, el trazado seguirá pintándose encima con estos mismos colores.
 *
 * Lo planificado va en trazo fino y punteado; lo recorrido, en Cobalt sólido.
 * Pintar el trazado entero en sólido desde el principio decía que el recorrido
 * ya estaba hecho.
 *
 * Ember aparece una sola vez en toda la pantalla: el punto de la posición
 * actual. Por eso se ve.
 */
export function SessionRouteMap({ route, progress }: SessionRouteMapProps) {
  const points = useMemo(() => normalizeRoute(route), [route])
  const { travelled } = useMemo(
    () => splitRouteAtProgress(points, progress),
    [points, progress]
  )

  if (points.length < 2) return null

  const current = travelled.at(-1) ?? points[0]

  return (
    <svg
      viewBox="-8 -8 116 116"
      className="h-full w-full"
      role="img"
      aria-label={`Recorrido: ${Math.round(progress * 100)} por ciento completado`}
    >
      <defs>
        <pattern id="session-grid" width="12.5" height="12.5" patternUnits="userSpaceOnUse">
          <path
            d="M 12.5 0 L 0 0 0 12.5"
            fill="none"
            stroke="hsl(var(--cobalt-tint-2))"
            strokeWidth="0.4"
          />
        </pattern>
      </defs>
      <rect x="-8" y="-8" width="116" height="116" fill="url(#session-grid)" />

      <path
        d={toSvgPath(points)}
        fill="none"
        stroke="hsl(var(--cobalt-tint-3))"
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />

      {travelled.length >= 2 && (
        <path
          d={toSvgPath(travelled)}
          fill="none"
          stroke="hsl(var(--cobalt))"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      <circle cx={current.x} cy={current.y} r="6" fill="hsl(var(--ember))" opacity="0.25" />
      <circle cx={current.x} cy={current.y} r="3" fill="hsl(var(--ember))" />
    </svg>
  )
}
