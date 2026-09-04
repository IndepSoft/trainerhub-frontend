/**
 * La cuota de un alumno con su equipo: hasta cuándo tiene pagado.
 *
 * OJO CON EL NOMBRE, PORQUE HAY DOS SUSCRIPCIONES EN ESTA APLICACIÓN Y NO SON LA
 * MISMA. `Crew.subscriptionStatus` es la del EQUIPO con la plataforma —la
 * activa un administrador de plataforma y abre la puerta a incorporar gente—.
 * Esto es la del ALUMNO con su equipo: lo que paga por entrenar allí, y lo cobra
 * su entrenador. Ni se parecen en quién decide ni en qué desbloquean.
 *
 * NO GUARDA IMPORTES. Se ha dejado fuera a propósito: poner un precio obliga a
 * elegir moneda, decidir si es por alumno o por tarifa, y qué pasa cuando cambia
 * —¿retroactivo?—, y nada de eso se ha decidido. Lo que la pantalla de cobros
 * necesita para ser útil es QUIÉN VENCE Y CUÁNDO, y eso sí está. Añadir el
 * importe después es un campo; inventarse un modelo de precios ahora es
 * arriesgarse a tirarlo.
 */
export interface StudentSubscription {
  studentId: string
  crewId: string
  /**
   * Días que cubre cada pago.
   *
   * Mensual es lo corriente y por eso es el valor por defecto, pero se guarda
   * por alumno porque VARÍA: bonos trimestrales, un mes de prueba, el que paga
   * el año entero. Con un valor fijo en la aplicación, cada excepción obligaría
   * a falsear la fecha de vencimiento para que cuadrara.
   */
  periodDays: number
  /**
   * Hasta qué día está pagado, ese día incluido. `null` si nunca ha pagado.
   *
   * Una fecha y no un contador de días restantes: un contador hay que
   * recalcularlo cada día, y el día que nadie abra la aplicación se queda
   * parado. Una fecha es cierta sin que nadie la toque.
   */
  paidThrough: string | null
}

/** Lo corriente. Se ofrece como punto de partida, no como límite. */
export const DEFAULT_PERIOD_DAYS = 30

/**
 * Los periodos que se ofrecen de un toque.
 *
 * Lista corta y con nombre, no un campo numérico libre: cubre lo que se cobra de
 * verdad, y quien necesite otra cosa puede escribirla. Un desplegable de 1 a 365
 * no ayudaría a nadie.
 */
/*
 * CÓMO SE LLAMA CADA UNO no está aquí: los rótulos viven en
 * `shared/i18n/domainLabels.ts`. El dominio dice cuántos días dura cada periodo,
 * que es el dato; ponerle nombre es presentación.
 */
export const SUBSCRIPTION_PERIOD_DAYS: number[] = [30, 90, 180, 365]

/**
 * En qué punto está una cuota.
 *
 * `dueSoon` existe porque avisar el día del vencimiento es tarde: quien cobra
 * necesita margen para hablar con la persona, y quien paga para organizarse.
 */
export type SubscriptionState = 'never' | 'overdue' | 'dueSoon' | 'active'

/** Cuántos días antes del vencimiento se considera que la cuota «vence pronto». */
export const DUE_SOON_DAYS = 7

export interface SubscriptionStanding {
  state: SubscriptionState
  /**
   * Días que faltan para el vencimiento. Negativo si ya venció.
   *
   * `null` cuando nunca ha pagado: no hay ninguna fecha desde la que contar, y
   * devolver cero diría «vence hoy», que es falso.
   */
  daysLeft: number | null
}
