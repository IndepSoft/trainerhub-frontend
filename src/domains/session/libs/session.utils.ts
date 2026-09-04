import type { LiveSessionMetrics, RoutePoint } from '../types/session.types'

/**
 * Cálculos puros de la sesión. Sin React y sin estado: entran números, salen
 * números o cadenas. Todo lo que aquí se calcula se deriva de las dos
 * magnitudes medidas, nunca se almacena aparte.
 */

const SECONDS_PER_HOUR = 3600
const METERS_PER_KILOMETER = 1000

function padTwoDigits(value: number): string {
  return String(Math.floor(value)).padStart(2, '0')
}

/** `hh:mm:ss`. La hora se muestra siempre, aunque sea cero, para que la cifra no cambie de ancho a los sesenta minutos. */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / 60)
  const seconds = totalSeconds % 60
  return `${padTwoDigits(hours)}:${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`
}

/**
 * `m:ss`, y `h:mm:ss` pasada la hora. Para relojes cortos.
 *
 * `formatDuration` no vale aqui: pinta `00:01:12` para una serie de minuto y
 * doce, y esa cifra es la protagonista de la pantalla. Dos ceros delante roban
 * el sitio al numero que importa.
 */
export function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / 60)
  const seconds = totalSeconds % 60

  if (hours === 0) return `${minutes}:${padTwoDigits(seconds)}`
  return `${hours}:${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`
}

export function toKilometers(meters: number): number {
  return meters / METERS_PER_KILOMETER
}

/** Distancia con un decimal y coma, que es la convención en castellano. */
export function formatDistance(meters: number): string {
  return toKilometers(meters).toFixed(2).replace('.', ',')
}

/**
 * Ritmo en segundos por kilómetro.
 *
 * Devuelve `null` cuando aún no hay distancia recorrida: dividir por cero daría
 * `Infinity`, y un ritmo infinito no es un dato que la interfaz deba intentar
 * pintar. Que la ausencia sea `null` obliga a la vista a decidir qué mostrar.
 */
export function calculatePaceSeconds(metrics: LiveSessionMetrics): number | null {
  const kilometers = toKilometers(metrics.distanceMeters)
  if (kilometers <= 0) return null
  return metrics.elapsedSeconds / kilometers
}

/** `mm:ss`, o un guion largo cuando todavía no hay ritmo que mostrar. */
export function formatPace(paceSeconds: number | null): string {
  if (paceSeconds === null) return '—:—'
  const minutes = Math.floor(paceSeconds / 60)
  const seconds = Math.round(paceSeconds % 60)
  return `${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`
}

/**
 * Convierte el trazado a coordenadas de un `viewBox` de 100 x 100.
 *
 * Vive aquí y no en el componente del mapa porque es una transformación de
 * datos, no pintura: el mismo trazado normalizado sirve para un SVG, para un
 * lienzo o para el resumen posterior de la sesión.
 */
export function normalizeRoute(route: RoutePoint[]): Array<{ x: number; y: number }> {
  if (route.length === 0) return []

  const latitudes = route.map((point) => point.latitude)
  const longitudes = route.map((point) => point.longitude)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)

  // Un trazado de un solo punto, o perfectamente recto, daría rango cero y una
  // división por cero. En ese caso se centra.
  const latitudeRange = maxLatitude - minLatitude || 1
  const longitudeRange = maxLongitude - minLongitude || 1

  return route.map((point) => ({
    x: ((point.longitude - minLongitude) / longitudeRange) * 100,
    // La latitud crece hacia el norte y la Y del SVG hacia abajo: se invierte.
    y: 100 - ((point.latitude - minLatitude) / latitudeRange) * 100,
  }))
}

export interface NormalizedPoint {
  x: number
  y: number
}

/**
 * Parte el trazado normalizado en dos: lo ya recorrido y lo que queda.
 *
 * El corte cae entre dos vertices, asi que el ultimo punto de la parte recorrida
 * se interpola. Sin esa interpolacion el trazado avanzaria a saltos de vertice
 * en vez de de forma continua, y con trece puntos el salto se nota.
 *
 * Vive en `libs` y no en el componente porque es geometria, no pintura: el mismo
 * corte sirve para el resumen posterior de la sesion.
 */
export function splitRouteAtProgress(
  points: NormalizedPoint[],
  progress: number
): { travelled: NormalizedPoint[]; planned: NormalizedPoint[] } {
  if (points.length < 2) return { travelled: [], planned: points }

  const clamped = Math.min(Math.max(progress, 0), 1)
  const exactIndex = clamped * (points.length - 1)
  const lastWholeIndex = Math.floor(exactIndex)
  const fraction = exactIndex - lastWholeIndex

  const travelled = points.slice(0, lastWholeIndex + 1)

  if (lastWholeIndex < points.length - 1) {
    const from = points[lastWholeIndex]
    const to = points[lastWholeIndex + 1]
    travelled.push({
      x: from.x + (to.x - from.x) * fraction,
      y: from.y + (to.y - from.y) * fraction,
    })
  }

  return { travelled, planned: points }
}

/** Construye el atributo `d` de un `<path>` a partir de puntos normalizados. */
export function toSvgPath(points: NormalizedPoint[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}
