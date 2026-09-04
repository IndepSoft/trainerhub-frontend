import type { Session } from './entities/session'

/**
 * Cómo han evolucionado las cargas de un ejercicio. Funciones puras, sin React.
 *
 * Vive en `shared/domain` porque la necesitan DOS dominios: la ficha del alumno,
 * que la pinta, y la sesión en vivo, que sólo quiere el último peso para dejarlo
 * puesto en el campo. Es el criterio de elevación de siempre, y además evita lo
 * que estaba a punto de pasar: dos definiciones de «el último peso de este
 * ejercicio» que podrían discrepar.
 *
 * NADA DE ESTO SE ALMACENA. Sale de los `SetRecord` que anotó cada sesión, así
 * que corregir una sesión corrige la progresión sin más.
 */

/** Lo que se levantó de un ejercicio en un día de entrenamiento. */
export interface LoadPoint {
  /** Fecha local `YYYY-MM-DD` en la que se cerró la sesión. */
  date: string
  /**
   * La serie más pesada del día, que es la que marca el progreso.
   *
   * NO se promedian las series ni se suma el volumen: una sesión de
   * calentamiento a 40 y trabajo a 80 daría 60, un peso que no se levantó nunca.
   * La serie tope es un hecho medido.
   */
  topWeightKg: number
  /** Repeticiones de ESA serie. Sin ellas, 60×5 y 60×10 se leen igual. */
  reps: number
  /** Series de ese ejercicio con peso anotado ese día. */
  sets: number
}

export interface ExerciseLoadHistory {
  exerciseId: string
  /** De la más antigua a la más reciente, que es como se lee un progreso. */
  points: LoadPoint[]
}

/**
 * El historial de cargas de cada ejercicio, a partir de las sesiones de alguien.
 *
 * Sólo cuentan las sesiones CON RESULTADO y las series CON PESO anotado: una
 * sesión abandonada a medias no dice cuál era la carga de trabajo, y una serie
 * sin peso no es un cero, es un dato que no se tomó.
 *
 * Un ejercicio aparece con un solo punto si sólo se ha hecho una vez. Es
 * información: dice cuál fue la carga, aunque todavía no diga si sube.
 */
export function buildLoadProgression(sessions: Session[]): ExerciseLoadHistory[] {
  /** exerciseId -> fecha -> punto en construcción. */
  const byExercise = new Map<string, Map<string, LoadPoint>>()

  for (const session of sessions) {
    const result = session.result
    if (result === null || result.sets === undefined) continue

    for (const record of result.sets) {
      if (record.weightKg === undefined) continue

      const byDate = byExercise.get(record.exerciseId) ?? new Map<string, LoadPoint>()
      const previous = byDate.get(result.completedAt)

      if (previous === undefined) {
        byDate.set(result.completedAt, {
          date: result.completedAt,
          topWeightKg: record.weightKg,
          reps: record.repsDone,
          sets: 1,
        })
      } else {
        /*
         * La serie tope del día, y con SUS repeticiones. Cambiar sólo el peso
         * dejaría el número de repeticiones de otra serie al lado, que es un par
         * de datos que nunca ocurrió junto.
         */
        const isHeavier = record.weightKg > previous.topWeightKg
        byDate.set(result.completedAt, {
          date: result.completedAt,
          topWeightKg: isHeavier ? record.weightKg : previous.topWeightKg,
          reps: isHeavier ? record.repsDone : previous.reps,
          sets: previous.sets + 1,
        })
      }

      byExercise.set(record.exerciseId, byDate)
    }
  }

  return [...byExercise.entries()].map(([exerciseId, byDate]) => ({
    exerciseId,
    points: [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date)),
  }))
}

/**
 * El último peso anotado de cada ejercicio.
 *
 * Se deriva del mismo historial que pinta la ficha para que las dos cifras no
 * puedan discrepar: lo que la sesión deja puesto en el campo es exactamente el
 * último punto de la progresión.
 */
export function lastWeightByExercise(sessions: Session[]): Map<string, number> {
  const last = new Map<string, number>()

  for (const history of buildLoadProgression(sessions)) {
    const latest = history.points[history.points.length - 1]
    if (latest !== undefined) last.set(history.exerciseId, latest.topWeightKg)
  }

  return last
}

/**
 * Hasta cuántas repeticiones vale la estimación de máximo.
 *
 * Por encima de diez las fórmulas se separan del resultado real muy deprisa: una
 * serie de veinte mide resistencia, no fuerza máxima, y estimar un tope a partir
 * de ella da una cifra que nadie levantaría. Antes que dar un número malo, no se
 * da ninguno.
 */
export const ONE_REP_MAX_REPS_LIMIT = 10

/**
 * El máximo a una repetición que se deduce de una serie. `null` si no se deduce.
 *
 * ES UN MODELO, NO UNA MEDIDA. La fórmula es la de Epley —peso × (1 + reps/30)—,
 * y como toda estimación de 1RM tiene su margen: sirve para comparar dos sesiones
 * del mismo ejercicio, no para decidir a qué peso se intenta un récord.
 *
 * SE CALCULA AL PINTAR Y NO SE GUARDA EN NINGÚN SITIO, que es la regla de esta
 * capa entera: nada derivado se almacena. Si mañana se cambia de fórmula, el
 * historial no hay que migrarlo porque el historial son las series, no esto.
 *
 * A UNA REPETICIÓN NO SE ESTIMA NADA: el máximo es lo que se levantó. La fórmula
 * daría ahí un 3 % de más, que es el error de aplicar un modelo al único caso
 * que no lo necesita.
 *
 * Redondeado al kilo a propósito: un decimal fingiría una precisión que el
 * modelo no tiene.
 */
export function estimatedOneRepMax(point: LoadPoint): number | null {
  if (point.reps < 1 || point.reps > ONE_REP_MAX_REPS_LIMIT) return null
  if (point.reps === 1) return point.topWeightKg

  return Math.round(point.topWeightKg * (1 + point.reps / 30))
}

/**
 * Cuánto ha cambiado la carga entre las dos últimas veces, en kilos.
 *
 * `null` con un solo punto: con una sola sesión no hay progresión que medir, y
 * pintar un cero se leería como «no ha subido» cuando lo cierto es «todavía no
 * se sabe».
 */
export function loadChange(history: ExerciseLoadHistory): number | null {
  const { points } = history
  if (points.length < 2) return null

  return points[points.length - 1].topWeightKg - points[points.length - 2].topWeightKg
}
