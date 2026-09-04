/**
 * Fechas locales como clave, `YYYY-MM-DD`. Funciones puras.
 *
 * NO se usa `toISOString`: convierte a UTC y desplaza al dia anterior toda hora
 * de madrugada en husos negativos. Es el defecto de zona horaria que este
 * proyecto ya arreglo dos veces en el calendario, y el motivo de que se
 * construya por partes.
 */

import { activeLocale } from '@/shared/i18n/activeLocale'

/** `new Date(2026, 8, 8)` → `2026-09-08`. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * `2026-09-08` → «martes, 8 de septiembre».
 *
 * Se trocea la cadena en vez de `new Date('2026-09-08')`, que ISO interpreta
 * como UTC medianoche y en un huso negativo cae en el dia anterior.
 */
export function formatDateKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(activeLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
