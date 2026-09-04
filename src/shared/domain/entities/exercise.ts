/**
 * El ejercicio del catálogo, en términos de la aplicación.
 *
 * Vive en `shared/domain` desde que la sesión en vivo pinta los bloques de la
 * rutina que ejecuta: necesita el NOMBRE de cada ejercicio, y una prescripción
 * sólo guarda su identificador. Lo necesitan `trainings`, que lo mantiene, y
 * `session`, que lo lee. Quinta vez que se aplica el mismo criterio, escrito en
 * `student.ts`.
 *
 * Los catálogos que lo clasifican —grupos musculares, patrones, equipamiento— se
 * quedan en `trainings`: se referencian por identificador, así que no viajan con
 * el ejercicio, y la sesión en vivo no los necesita para nada.
 */

/**
 * Un ejercicio del catálogo.
 *
 * El equipamiento forma parte del ejercicio, no del bloque: «press de banca con
 * barra» y «press de banca con mancuernas» son entradas distintas —distinta
 * estabilización, distinta progresión de carga—, y si el material colgara del
 * bloque no podría existir una superserie de barra más polea.
 */
export interface Exercise {
  id: string
  name: string
  description?: string
  equipmentId: string
  movementPatternId: string
  /** El que hace el trabajo principal. Uno solo, a propósito. */
  primaryMuscleGroupId: string
  /** Los que acompañan. Sirven para categorizar y para repartir el volumen. */
  secondaryMuscleGroupIds: string[]
  instructions: string[]
}
