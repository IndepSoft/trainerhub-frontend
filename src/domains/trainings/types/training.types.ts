/**
 * Entidades del dominio de entrenamientos.
 */

export type TrainingLevel = 'Principiante' | 'Intermedio' | 'Avanzado'

/** Un ejercicio dentro de una rutina, con su prescripcion. */
export interface RoutineExercise {
  id: string
  name: string
  /** Series por repeticiones o tiempo, ya formateado: "3x12", "3x30 seg". */
  prescription: string
}

export interface Routine {
  id: string
  title: string
  description: string
  level: TrainingLevel
  durationMinutes: number
  exercises: RoutineExercise[]
}

/**
 * Ejercicio del catalogo, independiente de cualquier rutina.
 *
 * Nadie lo usa todavia: era el unico contenido de este fichero y no se importa
 * desde ningun sitio. Se conserva porque describe el catalogo que hara falta
 * -grupos musculares, material, instrucciones- y borrarlo perderia ese diseño.
 *
 * TODO: cablearlo cuando exista el catalogo de ejercicios, o eliminarlo si se
 * decide otro modelo.
 */
export interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroups: string[]
  equipment?: string
  instructions: string[]
}
