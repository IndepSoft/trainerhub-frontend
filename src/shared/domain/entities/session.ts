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

/**
 * Lo que de verdad ocurrió en una sesión, anotado al terminarla.
 *
 * NO EXISTÍA, Y ESE ERA EL AGUJERO. La sesión en vivo contaba las series
 * marcadas y el tiempo transcurrido, y al pulsar «terminar» todo eso moría con
 * el componente: sólo sobrevivía el estado `completed`. Progreso no tenía de
 * dónde sacar un número, así que se los inventaba —nivel 7, 340 de 500 XP—.
 *
 * Se guarda lo MEDIDO, nunca lo derivado: aquí no hay XP ni nivel, que se
 * calculan con las reglas de `progressRules` y cambiarían de valor el día que se
 * ajusten. Guardar el resultado del cálculo dejaría historiales que discrepan
 * entre sí.
 */
/**
 * Una serie tal y como OCURRIÓ, con lo que estaba prescrito al lado.
 *
 * Se guarda lo prescrito junto a lo hecho —no sólo lo hecho— porque la
 * prescripción se puede editar después: si la rutina pasa de «8-10» a «6-8»
 * mañana, la serie de ayer tiene que seguir diciendo contra qué se comparó. Sin
 * eso, el historial cambiaría de significado cada vez que alguien retoca un
 * bloque.
 *
 * NO LLEVA VEREDICTO. Si la serie fue rápida o lenta lo calcula
 * `setPerformance` a partir de estos números, así que ajustar el criterio no
 * reescribe lo que ya pasó. Es la misma razón por la que aquí no hay XP.
 */
export interface SetRecord {
  /** Identifica la serie dentro del plan de la sesión: `<prescripción>-<n>`. */
  stepId: string
  prescribedId: string
  exerciseId: string
  setNumber: number
  /** Repeticiones prescritas, tal y como estaban escritas: «8-10». */
  prescribedReps: string
  repsDone: number
  /** Segundos de trabajo: de empezar la serie a darla por terminada. */
  workSeconds: number
  /** Descanso REAL tras la serie. Cero si no llegó a descansarse. */
  restSeconds: number
  prescribedRestSeconds: number
}

export interface SessionResult {
  /** Series marcadas. Cero en cardio, que no se programa en series. */
  completedSets: number
  /** Series prescritas, para saber si la sesión se completó entera. */
  totalSets: number
  elapsedSeconds: number
  /**
   * Cuándo se cerró, en fecha local `YYYY-MM-DD`.
   *
   * Se anota además de `date` porque son cosas distintas: `date` es cuándo
   * estaba agendada, y una sesión del martes se puede cerrar el miércoles. La
   * racha cuenta días de entrenamiento reales, así que mira esta.
   */
  completedAt: string
  /**
   * Cada serie, medida.
   *
   * OPCIONAL, y lo será mientras haya sesiones anteriores a esto: las que se
   * cerraron con la pantalla vieja tienen `completedSets` y nada más. Cardio
   * tampoco lo trae, porque no se programa en series. Ausente significa «no se
   * midió», que es distinto de una lista vacía —«se midió y no hubo ninguna»—.
   */
  sets?: SetRecord[]
}

export interface Session {
  id: string
  /**
   * El crew al que pertenece. Lo pone el adaptador desde el ámbito activo.
   *
   * Sin esto, la multi-tenencia era ficticia: sólo las fichas de alumno estaban
   * acotadas, así que una cuenta recién registrada y sin equipo veía las
   * sesiones y las rutinas de otro. Medido en el navegador: «5 sesiones esta
   * semana» y tres rutinas, en un usuario que no pertenecía a ningún sitio.
   */
  crewId: string
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
  /**
   * Lo que ocurrió, o `null` mientras no haya ocurrido.
   *
   * Va con la sesión y no en una colección aparte porque es su desenlace, no
   * otra entidad: no hay resultado sin sesión ni resultado de dos sesiones.
   */
  result: SessionResult | null
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
