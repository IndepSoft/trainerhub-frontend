import { describeStanding } from '@/shared/domain/subscriptionRules'
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
  standing: SubscriptionStanding
): string {
  if (standing.state === 'overdue') {
    return `Hola ${studentFirstName}, tu cuota ${describeStanding(standing).toLowerCase()}. Cuando puedas, la renovamos y seguimos.`
  }

  if (standing.state === 'never') {
    return `Hola ${studentFirstName}, todavía no tenemos tu cuota registrada. Cuando quieras la ponemos al día.`
  }

  if (standing.daysLeft === 0) {
    return `Hola ${studentFirstName}, tu cuota vence hoy. Avísame y la renovamos.`
  }

  return `Hola ${studentFirstName}, tu cuota ${describeStanding(standing).toLowerCase()}. Te aviso con tiempo por si quieres renovarla.`
}
