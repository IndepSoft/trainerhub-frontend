/**
 * La clave de fecha local, `YYYY-MM-DD`. Una sola implementación.
 *
 * HABÍA TRES COPIAS: en las utilidades de la agenda, en las del panel y otra
 * privada dentro de la semilla de sesiones. Ninguna estaba mal —las tres
 * evitaban `toISOString` por el mismo motivo—, y eso es justamente lo que hace
 * peligrosa la duplicación: se mantienen igual hasta que una cambia.
 *
 * Vive en `shared/lib` y no en `shared/domain` porque no es una regla de
 * negocio, es una conversión; y ahí puede usarla también la infraestructura, que
 * es lo que impedía a la semilla reutilizar la de la agenda.
 */

/**
 * Convierte una fecha a su clave `YYYY-MM-DD` **en hora local**.
 *
 * Sustituye a `date.toISOString().split('T')[0]`, que era un error real:
 * `toISOString` pasa a UTC, así que en un huso negativo —Perú es UTC-5— una
 * sesión de las 20:00 del día 15 se convertía en el día 16 y aparecía en la
 * columna equivocada. El fallo sólo se manifestaba según la hora del día, que es
 * lo que lo hacía difícil de ver.
 */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * La clave de hoy. Atajo del anterior, que se pide en muchos sitios.
 */
export function todayKey(): string {
  return toLocalDateKey(new Date())
}
