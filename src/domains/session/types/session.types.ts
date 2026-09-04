/**
 * Entidades de la sesión en vivo.
 *
 * Se declaran aquí y no dentro de los componentes por el mismo motivo que en
 * `dashboard.types`: el dato debe sobrevivir a cualquier cambio de presentación,
 * y un segundo componente debe poder reutilizarlo sin arrastrar los props del
 * primero.
 */

/** Punto del trazado, en grados decimales. */
export interface RoutePoint {
  latitude: number
  longitude: number
}

export type LiveSessionState = 'running' | 'paused' | 'finished'

/**
 * Métricas acumuladas de la sesión.
 *
 * `elapsedSeconds` y `distanceMeters` son las dos únicas magnitudes medidas.
 * Todo lo demás —ritmo, velocidad— se deriva de ellas en `session.utils`, para
 * que no existan dos fuentes de verdad que puedan discrepar.
 */
export interface LiveSessionMetrics {
  elapsedSeconds: number
  distanceMeters: number
  calories: number
}

export interface LiveSession {
  id: string
  /** Nombre del plan o rutina que se está ejecutando. */
  title: string
  studentName: string
  metrics: LiveSessionMetrics
  route: RoutePoint[]
}
