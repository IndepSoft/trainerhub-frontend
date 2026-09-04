/**
 * A dónde quería ir quien fue desviado al login.
 *
 * ERA UN AGUJERO EN EL FLUJO DEL QR, y en el más frecuente de todos: alguien sin
 * cuenta escanea el código de su entrenador, `ProtectedRoute` le manda a
 * identificarse, y al terminar aterrizaba en su progreso **con el código
 * perdido**. Tenía que volver a pedirle el QR a alguien que ya se lo había
 * enseñado.
 *
 * Se guarda la RUTA COMO TEXTO —camino y parámetros— y no el objeto `Location`
 * del enrutador: viaja por el estado del historial, que se serializa, y de él
 * sólo hace falta a dónde iba.
 */

/** La clave del estado de navegación. */
export interface IntendedLocationState {
  from: string
}

/**
 * Lee la ruta guardada, o `null` si no hay ninguna.
 *
 * El estado del historial es dato de fuera: lo puede haber escrito otra versión
 * de la aplicación, o cualquiera desde la consola. Se estrecha comprobando, sin
 * ningún `as`, y sólo se acepta una ruta interna —empezar por `/` y no por `//`,
 * que el navegador interpreta como otro dominio—.
 */
export function readIntendedPath(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('from' in state)) return null

  const from = state.from
  if (typeof from !== 'string') return null
  if (!from.startsWith('/') || from.startsWith('//')) return null

  return from
}
