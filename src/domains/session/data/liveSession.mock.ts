import type { LiveSession, RoutePoint } from '../types/session.types'

/**
 * Datos simulados de la sesión en vivo.
 *
 * TODO: sustituir por el repositorio cuando exista el backend. La costura es
 * `useLiveSession`: cuando llegue el GPS real y la persistencia, se cambia ese
 * hook y ni la página ni los componentes se enteran.
 *
 * El trazado son coordenadas reales de un recorrido corto para que la forma no
 * sea una línea recta artificial.
 */
const ROUTE: RoutePoint[] = [
  { latitude: -12.0464, longitude: -77.0428 },
  { latitude: -12.0471, longitude: -77.0419 },
  { latitude: -12.0483, longitude: -77.0412 },
  { latitude: -12.0495, longitude: -77.0408 },
  { latitude: -12.0508, longitude: -77.0411 },
  { latitude: -12.0519, longitude: -77.0421 },
  { latitude: -12.0524, longitude: -77.0436 },
  { latitude: -12.0521, longitude: -77.0452 },
  { latitude: -12.0511, longitude: -77.0463 },
  { latitude: -12.0497, longitude: -77.0468 },
  { latitude: -12.0483, longitude: -77.0464 },
  { latitude: -12.0472, longitude: -77.0453 },
  { latitude: -12.0466, longitude: -77.0440 },
]

/**
 * Ritmo de avance simulado mientras no hay GPS.
 *
 * 2,8 m/s son unos 5:57 min/km, un trote sostenido creíble. Se declara aquí,
 * con los datos, y no en el hook: es un dato del simulador, no una decisión de
 * orquestación.
 */
export const SIMULATED_METERS_PER_SECOND = 2.8

/** Kilocalorías por segundo a ese ritmo, para una persona de unos 70 kg. */
export const SIMULATED_CALORIES_PER_SECOND = 0.19

/**
 * A esta pantalla se entra con la sesión ya en marcha, no en cero: es el estado
 * en el que un entrenador la abre. Arrancar a cero además ocultaría el trazado
 * recorrido, que sólo aparece cuando hay avance.
 */
const ELAPSED_ON_ENTRY_SECONDS = 425

export const liveSessionMock: LiveSession = {
  id: 'live-1',
  title: 'Fuerza Avanzada',
  studentName: 'María González',
  // Las tres magnitudes se derivan del tiempo transcurrido en vez de escribirse
  // a mano, para que no puedan discrepar entre sí.
  metrics: {
    elapsedSeconds: ELAPSED_ON_ENTRY_SECONDS,
    distanceMeters: ELAPSED_ON_ENTRY_SECONDS * SIMULATED_METERS_PER_SECOND,
    calories: ELAPSED_ON_ENTRY_SECONDS * SIMULATED_CALORIES_PER_SECOND,
  },
  route: ROUTE,
}
