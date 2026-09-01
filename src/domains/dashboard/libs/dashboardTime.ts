import { toLocalDateKey } from '@/shared/lib/dateKey'

/**
 * Fechas del panel. Funciones puras, sin React.
 *
 * Nada de `toISOString` en ningun sitio: convierte a UTC y desplaza al dia
 * anterior en husos negativos. Todo se construye por partes, que es como se
 * arreglaron los dos fallos de huso que tuvo el calendario.
 */

/**
 * El lunes y el domingo de la semana que contiene la fecha.
 *
 * De lunes a domingo, como el microciclo de un plan, y no de domingo a sabado:
 * dos definiciones distintas de «esta semana» en la misma aplicacion darian dos
 * cifras distintas para lo mismo.
 */
export function weekBounds(date: Date): { from: string; to: string } {
  const isoWeekday = (date.getDay() + 6) % 7
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - isoWeekday)
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)

  return { from: toLocalDateKey(monday), to: toLocalDateKey(sunday) }
}

/**
 * «Hoy», «ayer», «hace 3 dias».
 *
 * En dias y no en horas porque una sesion se guarda con fecha y tramo, no con un
 * instante: fingir precision de minutos sobre un dato que no la tiene seria
 * inventarsela.
 */
export function describeTimeAgo(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const when = new Date(year, month - 1, day)
  const today = new Date()
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const days = Math.round((midnight.getTime() - when.getTime()) / 86_400_000)

  if (days <= 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} dias`
  if (days < 14) return 'Hace una semana'
  return `Hace ${Math.floor(days / 7)} semanas`
}

/**
 * `2026-09-08` → «mar 8 sep».
 *
 * Corto a proposito: comparte linea con la hora en la marca de la linea de
 * tiempo, y a 375 px el nombre completo del dia la parte en dos.
 */
export function formatStamp(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
