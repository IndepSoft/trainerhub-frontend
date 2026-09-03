/**
 * Cuánto hace que se publicó algo, en palabras.
 *
 * SOBRE UN INSTANTE, no sobre una fecha, y por eso no se reutiliza
 * `describeTimeAgo` del panel: aquello redondea a días porque una sesión ocurre
 * un día, y un anuncio de hace veinte minutos no puede leerse como «hoy».
 *
 * Pasadas las 48 horas se pasa a la fecha escrita. «Hace 9 días» obliga a contar
 * hacia atrás para saber cuándo fue; a partir de ahí la fecha informa más.
 */

import { activeLocale } from '@/shared/i18n/activeLocale'
import type { Translate } from '@/shared/i18n/LanguageContext'

export function describePostTime(
  createdAt: string,
  t: Translate,
  now: Date = new Date()
): string {
  const published = new Date(createdAt)
  const minutes = Math.floor((now.getTime() - published.getTime()) / 60_000)

  // Un reloj adelantado en el dispositivo daría minutos negativos y un «hace -3
  // minutos». Se trata como recién publicado, que es lo que quiere decir.
  if (minutes < 1) return t('postTime.justNow')
  if (minutes < 60) return t('postTime.minutes', { count: minutes })

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('postTime.hours', { count: hours })
  if (hours < 48) return t('postTime.yesterday')

  return published.toLocaleDateString(activeLocale(), { day: 'numeric', month: 'long' })
}
