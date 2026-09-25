/**
 * Lo último que respondió cada lectura, para poder pintarlo otra vez al volver.
 *
 * EN MEMORIA Y NO EN DISCO, a propósito. Esto no es persistencia: es que
 * cambiar de módulo y volver no tenga que empezar de cero. Guardarlo en
 * `localStorage` obligaría a decidir cuándo caduca, a serializar entidades y a
 * responder qué pasa cuando el esquema cambia; y al reabrir la aplicación lo
 * que hay que enseñar es lo que el servidor diga, no lo de ayer.
 *
 * El dato viaja como `unknown`: quien lo guardó sabe de qué tipo es, y es
 * `useCachedQuery` —un único sitio— quien lo estrecha al leerlo.
 */
const entries = new Map<string, unknown>()

/** Lo guardado para esa clave, o `undefined` si esa lectura no se ha hecho aún. */
export function readCachedValue(key: string): unknown {
  return entries.get(key)
}

export function writeCachedValue(key: string, value: unknown): void {
  entries.set(key, value)
}

/**
 * Vacía la caché entera.
 *
 * SE LLAMA AL CERRAR SESIÓN, y no es una limpieza de cortesía: los datos de
 * quien acaba de salir no pueden parpadear en la pantalla de quien entra
 * después en el mismo dispositivo. Es la misma razón por la que el ámbito del
 * equipo se suelta con la sesión.
 *
 * El cambio de equipo NO necesita vaciarla: el identificador del equipo activo
 * entra en la clave de cada lectura, así que los datos de uno no responden por
 * el otro.
 */
export function clearQueryCache(): void {
  entries.clear()
}

/**
 * La clave de una lectura, a partir de sus partes.
 *
 * Las partes son el nombre de la lectura y lo que la delimita —el equipo
 * activo, el alumno—. `undefined` y `null` se escriben tal cual en vez de
 * omitirse: «las sesiones de nadie» y «las sesiones del alumno 7» tienen que
 * ser claves distintas, y omitir la parte vacía las haría colisionar.
 */
export function cacheKey(parts: readonly (string | number | null | undefined)[]): string {
  return parts.map((part) => String(part)).join('|')
}
