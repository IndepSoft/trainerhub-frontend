/**
 * Catálogos de referencia del entrenamiento.
 *
 * Son datos que el entrenador NO crea: existen antes que él y son estables. Por
 * eso viven aparte de las entidades que sí compone —ejercicios, rutinas,
 * planes—, y por eso se referencian por identificador en vez de copiarse.
 *
 * La terminología sigue la de la literatura de fuerza en castellano, que en
 * Perú no diverge de la general: series, repeticiones, RIR, microciclo,
 * mesociclo.
 */

/** Grupo muscular. El catálogo cubre los que un entrenador programa por separado. */
export interface MuscleGroup {
  id: string
  name: string
  /** Región, para agrupar en la interfaz sin repetir la lista entera. */
  region: 'tren superior' | 'tren inferior' | 'core'
}

/**
 * Patrón de movimiento.
 *
 * Complementa al grupo muscular, no lo sustituye. Programar por patrones
 * —empuje, tracción, dominante de cadera— es lo que evita que una rutina repita
 * tres veces el mismo gesto con músculos distintos, y es la forma en que se
 * equilibra una sesión.
 */
export interface MovementPattern {
  id: string
  name: string
}

/**
 * Material con el que se ejecuta el ejercicio.
 *
 * Se llama «equipamiento» y no «máquina» a propósito: barra, mancuernas, polea,
 * kettlebell, banda y peso corporal no son máquinas, y son la mayor parte del
 * entrenamiento. Una tabla llamada «máquinas» obligaría a meterlos donde no
 * encajan o a no poder representarlos.
 */
export interface Equipment {
  id: string
  name: string
  /** Peso libre, máquina guiada, o sin carga externa. */
  kind: 'peso libre' | 'máquina' | 'accesorio' | 'peso corporal'
}

/** Objetivo de un plan. Determina cómo se prescribe: series, repeticiones, RIR. */
export interface TrainingObjective {
  id: string
  name: string
  description: string
}

/**
 * División del entrenamiento, o *split*.
 *
 * Es distinto de la frecuencia: la división dice CÓMO se reparte el cuerpo entre
 * sesiones; la frecuencia, cuántas veces por semana se entrena cada músculo. La
 * primera es catálogo, la segunda es un número del plan.
 */
export interface TrainingSplit {
  id: string
  name: string
  description: string
  /** Sesiones por microciclo que asume esta división. */
  sessionsPerWeek: number
}
