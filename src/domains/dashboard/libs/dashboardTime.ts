import { weekBounds } from '@/shared/lib/dateKey'
import { activeLocale } from '@/shared/i18n/activeLocale'

// Se reexporta para no tocar a quien ya la importaba de aqui: subio a
// `shared/lib` al necesitarla tambien el ranking semanal.
export { weekBounds }

/**
 * Fechas del panel. Funciones puras, sin React.
 *
 * Nada de `toISOString` en ningun sitio: convierte a UTC y desplaza al dia
 * anterior en husos negativos. Todo se construye por partes, que es como se
 * arreglaron los dos fallos de huso que tuvo el calendario.
 */


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

  /*
   * ERAN CINCO CADENAS ESCRITAS A MANO -«Hoy», «Ayer», «Hace 3 dias»...-. El
   * navegador ya sabe decir esto en cualquier idioma, y ademas mejor: con
   * `numeric: 'auto'` elige la palabra -«ayer»- en vez del numero -«hace 1
   * dia»- donde el idioma la tiene, y cada lengua decide donde la tiene.
   */
  const relative = new Intl.RelativeTimeFormat(activeLocale(), { numeric: 'auto' })

  if (days <= 0) return relative.format(0, 'day')
  if (days < 7) return relative.format(-days, 'day')
  return relative.format(-Math.floor(days / 7), 'week')
}

/**
 * `2026-09-08` → «mar 8 sep».
 *
 * Corto a proposito: comparte linea con la hora en la marca de la linea de
 * tiempo, y a 375 px el nombre completo del dia la parte en dos.
 */
export function formatStamp(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(activeLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
