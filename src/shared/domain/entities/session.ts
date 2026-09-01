/**
 * La sesión agendada, en términos de la aplicación.
 *
 * Vive en `shared/domain` desde que la ficha de un estudiante lista y agenda sus
 * sesiones: la necesitan DOS dominios, `calendar` y `students`. Es el mismo
 * criterio que declaran `student.ts` y `routine.ts`, y el propio almacén que la
 * servía dejaba escrito que éste sería el día.
 */

/**
 * El ciclo de vida de una sesión.
 *
 * `completed` faltaba, y su ausencia era un agujero del modelo: una sesión que
 * ya ha ocurrido no tenía dónde ir. Nacía `pending` y ahí se quedaba para
 * siempre, así que nada de lo que el entrenador hacía podía darse por hecho.
 *
 * `cancelled` y `completed` son ambos finales, y distintos a propósito: una
 * cancelada libera su hueco en la agenda —no cuenta como choque—, una completada
 * lo ocupó de verdad.
 */
export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export type SessionKind = 'individual' | 'group'

/**
 * Qué clase de entrenamiento es. Decide con qué pantalla se ejecuta.
 *
 * NO se deriva de si la sesión tiene rutina. Sería más barato y sería falso: una
 * evaluación inicial no tiene rutina y tampoco es cardio, y acabaría enseñando
 * un mapa de GPS. Se pregunta, que son dos opciones.
 *
 * Tampoco se mezcla con `SessionKind`, que dice QUIÉN asiste —uno o un grupo— y
 * es una pregunta distinta: hay clases grupales de fuerza y salidas a correr
 * individuales.
 */
export type SessionModality = 'strength' | 'cardio'

export interface Session {
  id: string
  /** Para qué es la sesión. No repite el nombre del alumno: eso se resuelve. */
  title: string
  /**
   * El alumno, POR REFERENCIA.
   *
   * Antes era su nombre en texto, y el dato ya se había corrompido: las sesiones
   * simuladas hablaban de «María García» y «Ana Martínez» cuando en el padrón
   * estaban «María Gómez» y «Ana Torres». Nadie lo notó porque nada obligaba a
   * que coincidieran. Con el identificador, el nombre se resuelve y cambiarlo en
   * la ficha del alumno se propaga a toda su agenda.
   *
   * `null` en las sesiones de grupo, que no son de nadie en particular.
   */
  studentId: string | null
  kind: SessionKind
  /** Fuerza en sala o cardio. Determina la pantalla de ejecución. */
  modality: SessionModality
  category: string
  /** Fecha local en formato `YYYY-MM-DD`. Ver `toLocalDateKey`. */
  date: string
  /** Hora local en formato `HH:mm`, alineada con los tramos de la agenda. */
  time: string
  durationMinutes: number
  location: string
  status: SessionStatus
  notes: string
  /**
   * La rutina que se ejecuta, o `null` si no hay ninguna.
   *
   * Por referencia y no por copia: si el entrenador corrige la rutina, la sesión
   * agendada refleja la corrección, que es lo que se espera de algo que todavía
   * no ha ocurrido. `null` es corriente —una evaluación inicial no ejecuta
   * ninguna rutina—, no una carencia.
   */
  routineId: string | null
}

/**
 * Los tramos en los que se puede agendar. Media hora, de 8 a 21.
 *
 * Viven junto a la entidad porque son el vocabulario de su campo `time`, igual
 * que `SessionStatus` lo es de `status`. Estaban en `calendar/data`, y ahi
 * dejaron de valer en cuanto la ficha del estudiante tambien agenda: o subian, o
 * un dominio importaba del otro, o habia dos listas que mantener a la vez —que
 * es como llegaron ahi, duplicadas entre dos ficheros—.
 */
export const SESSION_TIME_SLOTS: string[] = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00',
]

/** Dónde puede ocurrir una sesión. */
export const SESSION_LOCATIONS: string[] = [
  'Gimnasio Principal',
  'Sala Grupal',
  'Sala de Evaluación',
  'Oficina',
  'Exterior',
  'Online',
]

/** Duraciones ofrecidas, en minutos. */
export const SESSION_DURATIONS: string[] = ['30', '45', '60', '90']
