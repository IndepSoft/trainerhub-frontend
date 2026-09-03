import { describeStanding } from '@/shared/i18n/duesWording'
import type { Translate } from '@/shared/i18n/LanguageContext'
import type { SubscriptionStanding } from '@/shared/domain/entities/studentSubscription'

/**
 * El borrador del recordatorio de cuota.
 *
 * SE REDACTA DISTINTO SEGÚN EL ESTADO, porque no es lo mismo avisar de algo que
 * va a pasar que reclamar algo que ya pasó. Un texto único obligaría a elegir
 * entre sonar seco con quien aún no debe nada o blando con quien lleva un mes
 * sin pagar, y quien manda veinte al mes no va a reescribirlos uno a uno.
 *
 * NI CIFRAS NI MEDIOS DE PAGO: no hay importes en el modelo, y meterlos aquí
 * significaría inventárselos. El recordatorio dice qué pasa y cuándo; cómo se
 * paga ya lo saben los dos.
 *
 * Es un BORRADOR. Se puede reescribir antes de mandarlo, porque el tono depende
 * de a quién se le manda y eso no lo sabe una función.
 */
export function duesReminderDraft(
  studentFirstName: string,
  standing: SubscriptionStanding,
  /* Traducir llega por parametro: esto es una funcion pura, no un componente. */
  t: Translate
): string {
  const name = studentFirstName

  if (standing.state === 'overdue') {
    return t('dues.reminder.overdue', {
      name,
      standing: describeStanding(standing, t).toLowerCase(),
    })
  }

  if (standing.state === 'never') return t('dues.reminder.never', { name })

  if (standing.daysLeft === 0) return t('dues.reminder.today', { name })

  return t('dues.reminder.soon', {
    name,
    standing: describeStanding(standing, t).toLowerCase(),
  })
}
