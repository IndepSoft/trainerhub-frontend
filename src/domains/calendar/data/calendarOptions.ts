import { activeLocale } from '@/shared/i18n/activeLocale'

/**
 * Opciones fijas de la agenda.
 *
 * Los tramos y las ubicaciones SUBIERON a `shared/domain/entities/session.ts`
 * cuando la ficha del estudiante paso a agendar tambien: son vocabulario de la
 * sesion, no de esta vista. Se reexportan con el nombre que ya usaba el dominio.
 */
export { SESSION_LOCATIONS } from '@/shared/domain/entities/session'
export { SESSION_TIME_SLOTS as TIME_SLOTS } from '@/shared/domain/entities/session'

/**
 * Los siete dias, de lunes a domingo y en el idioma activo.
 *
 * ERA UNA LISTA A MANO -«Lun», «Mar», «Mie»...-. Ahora la produce `Intl`, que
 * ademas de traducir sabe la abreviatura que usa cada lengua; escribirlas a mano
 * en tres idiomas habria sido copiar lo que el navegador ya trae.
 *
 * Es una funcion y no una constante: el idioma cambia sin recargar, y una
 * constante de modulo se habria quedado con el de la primera carga. La semana
 * empieza en LUNES, que es lo que pinta la rejilla; el 5 de enero de 1970 fue
 * lunes y sirve de ancla para recorrer los siete.
 */
const MONDAY_ANCHOR = new Date(1970, 0, 5)

export function weekDayLabels(): string[] {
  const formatter = new Intl.DateTimeFormat(activeLocale(), { weekday: 'short' })

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(MONDAY_ANCHOR)
    day.setDate(MONDAY_ANCHOR.getDate() + index)
    return formatter.format(day)
  })
}
