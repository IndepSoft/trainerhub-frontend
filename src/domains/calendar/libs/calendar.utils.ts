/**
 * Utilidades de fecha de la agenda. Funciones puras, sin React ni estado.
 */

/**
 * Convierte una fecha a su clave `YYYY-MM-DD` **en hora local**.
 *
 * Sustituye a `date.toISOString().split('T')[0]`, que era un error real:
 * `toISOString` pasa a UTC, asi que en un huso negativo -Perú es UTC-5- una
 * sesión de las 20:00 del día 15 se convertía en el día 16 y aparecía en la
 * columna equivocada. El fallo solo se manifestaba según la hora del día, que
 * es lo que lo hacía difícil de ver.
 */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Los siete días de la semana que contiene `date`, empezando en lunes. */
export function getWeekDates(date: Date): Date[] {
  const startOfWeek = new Date(date)
  const dayOfWeek = startOfWeek.getDay()
  // getDay() devuelve 0 para domingo: se retrocede 6 días para que la semana
  // empiece en lunes.
  const offsetToMonday = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  startOfWeek.setDate(offsetToMonday)

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + index)
    return day
  })
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function isToday(date: Date): boolean {
  return date.toDateString() === new Date().toDateString()
}

export function formatWeekRange(weekDates: Date[]): string {
  const first = weekDates[0].toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  })
  const last = weekDates[6].toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `${first} - ${last}`
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Iniciales a partir del nombre completo del alumno.
 *
 * Antes cada sesion cargaba un campo `avatar` con las iniciales escritas a
 * mano -"MG", "CL"-, que podian quedar desincronizadas del nombre. Ahora se
 * derivan.
 */
export function getStudentInitials(fullName: string): string {
  const [first = '', second = ''] = fullName.trim().split(/\s+/)
  return (first.charAt(0) + second.charAt(0)).toUpperCase() || '?'
}

/**
 * Interpreta una clave `YYYY-MM-DD` como fecha **local**.
 *
 * Contrapartida de `toLocalDateKey`. Hace falta porque `new Date('2026-08-27')`
 * se interpreta como medianoche UTC, no local: al mostrarla con
 * `toLocaleDateString` en un huso negativo retrocede al dia anterior. Era
 * exactamente lo que le pasaba al modal de detalle, que mostraba el dia previo
 * al de la sesion.
 */
export function parseLocalDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Fecha corta para pantallas estrechas: «sáb 29 ago».
 *
 * `formatFullDate` da «sábado, 29 de agosto de 2026», que a 375 px obliga a la
 * barra de navegación a partirse en dos filas y se come unos 56 px del campo de
 * visión de la rejilla. El año se omite a propósito: en una agenda se navega
 * dentro del año en curso, y cuando no es así lo dice el propio contexto.
 */
export function formatCompactDate(date: Date): string {
  return date
    .toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '')
}

/** Rango de semana corto: «24 - 30 ago». */
export function formatCompactWeekRange(weekDates: Date[]): string {
  const first = weekDates[0].getDate()
  const last = weekDates[6]
  const month = last.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
  return `${first} - ${last.getDate()} ${month}`
}
