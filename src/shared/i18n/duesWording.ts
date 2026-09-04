import type { SubscriptionStanding } from '@/shared/domain/entities/studentSubscription'
import type { Translate } from './LanguageContext'

/**
 * Como se dice el estado de una cuota, en palabras y no en una fecha suelta.
 *
 * «Vence el 12 de octubre» obliga a mirar el calendario para saber si eso es
 * pronto; «faltan 3 dias» no. La fecha exacta se enseña al lado, para quien la
 * necesite.
 *
 * ESTABA EN `shared/domain/subscriptionRules.ts`, que calcula el estado. Ahi el
 * texto sobraba desde el principio y con la traduccion dejo de poderse: el
 * dominio no conoce a nadie por encima suyo.
 *
 * Traducir llega por parametro porque esto lo llaman dos sitios, y uno de ellos
 * -el borrador del recordatorio- no es un componente.
 */
export function describeStanding(standing: SubscriptionStanding, t: Translate): string {
  if (standing.state === 'never' || standing.daysLeft === null) return t('dues.none')

  if (standing.daysLeft < 0) {
    const days = Math.abs(standing.daysLeft)
    return days === 1 ? t('dues.overdueYesterday') : t('dues.overdueDays', { days })
  }

  if (standing.daysLeft === 0) return t('dues.today')
  if (standing.daysLeft === 1) return t('dues.tomorrow')
  return t('dues.inDays', { days: standing.daysLeft })
}
