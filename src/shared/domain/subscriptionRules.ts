import { toLocalDateKey } from '../lib/dateKey'
import {
  DUE_SOON_DAYS,
  type StudentSubscription,
  type SubscriptionStanding,
} from './entities/studentSubscription'

/**
 * Las reglas de la cuota. Puras: entran fechas, salen estados.
 *
 * Aquí y no en la pantalla porque las preguntan tres sitios —la ficha del
 * alumno, la cola de cobros y el aviso que se le manda—, y una regla repetida en
 * tres sitios acaba aplicándose en dos. Es la misma lección que dejó
 * `canEnrollMembers`.
 */

/** Días entre dos claves de fecha. Positivo si la segunda es posterior. */
function daysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)

  /*
   * Se comparan mediodías y no medianoches: con horario de verano, un día dura
   * 23 o 25 horas, y dividir la diferencia entre 24 devuelve 0,96 días donde hay
   * uno. Desde el mediodía, esa hora de más o de menos no cruza ningún límite.
   */
  const start = new Date(fromYear, fromMonth - 1, fromDay, 12).getTime()
  const end = new Date(toYear, toMonth - 1, toDay, 12).getTime()

  return Math.round((end - start) / 86_400_000)
}

/** Suma días a una clave de fecha, construyéndola por partes. */
function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  return toLocalDateKey(new Date(year, month - 1, day + days))
}

/**
 * En qué punto está la cuota de alguien.
 *
 * `today` se pasa y no se toma de dentro: así la función es pura, se puede
 * probar sin viajar en el tiempo, y la pantalla decide una sola vez qué día es
 * —si cada fila lo preguntara por su cuenta, una lista abierta a medianoche
 * mezclaría dos días—.
 */
export function subscriptionStanding(
  subscription: StudentSubscription | undefined,
  today: string
): SubscriptionStanding {
  if (subscription === undefined || subscription.paidThrough === null) {
    return { state: 'never', daysLeft: null }
  }

  // El último día pagado cuenta como pagado: quien tiene hasta hoy, está al día.
  const daysLeft = daysBetween(today, subscription.paidThrough)

  if (daysLeft < 0) return { state: 'overdue', daysLeft }
  if (daysLeft <= DUE_SOON_DAYS) return { state: 'dueSoon', daysLeft }
  return { state: 'active', daysLeft }
}

/**
 * Hasta cuándo queda pagado al renovar.
 *
 * SE ENCADENA SI VA POR DELANTE Y SE REINICIA SI VENCIÓ. Quien renueva antes de
 * tiempo no pierde los días que le quedaban —el periodo nuevo empieza cuando
 * acaba el viejo—; quien lleva dos meses sin pagar no compra dos meses de
 * pasado, empieza hoy. Encadenar siempre regalaría meses vencidos; reiniciar
 * siempre castigaría al que paga puntual.
 */
export function renewedThrough(
  subscription: StudentSubscription,
  today: string
): string {
  const from =
    subscription.paidThrough !== null && subscription.paidThrough > today
      ? subscription.paidThrough
      : today

  return addDays(from, subscription.periodDays)
}

/*
 * CÓMO SE DICE EL ESTADO NO ESTÁ AQUÍ, sino en `shared/i18n/duesWording.ts`.
 * Esto calcula en qué punto está una cuota; ponerle palabras es presentación, y
 * mientras el texto vivió aquí dentro el dominio habría tenido que conocer al
 * diccionario para traducirse.
 */
