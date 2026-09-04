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

/** Un tramo de fechas, ambos extremos incluidos, en claves locales. */
export interface DateRange {
  from: string
  to: string
}

/**
 * El lunes y el domingo de la semana que contiene la fecha.
 *
 * De lunes a domingo, como el microciclo de un plan, y no de domingo a sábado:
 * dos definiciones distintas de «esta semana» en la misma aplicación darían dos
 * cifras distintas para lo mismo —una en el panel y otra en el ranking—.
 *
 * Estaba en las utilidades del panel. Sube aquí al necesitarla también el
 * ranking semanal, que es el mismo criterio de siempre: se comparte lo que dos
 * dominios usan.
 */
export function weekBounds(date: Date): DateRange {
  const isoWeekday = (date.getDay() + 6) % 7
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - isoWeekday)
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)

  return { from: toLocalDateKey(monday), to: toLocalDateKey(sunday) }
}

/**
 * El primer y el último día del mes que contiene la fecha.
 *
 * El día 0 del mes siguiente es el último del actual: el constructor normaliza
 * solo, así que no hay que saber cuántos días tiene febrero ni si el año es
 * bisiesto.
 */
export function monthBounds(date: Date): DateRange {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  return { from: toLocalDateKey(first), to: toLocalDateKey(last) }
}
