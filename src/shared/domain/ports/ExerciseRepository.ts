import type { Exercise } from '../entities/exercise'

/**
 * Puerto del catálogo de ejercicios.
 *
 * Nace cuando la sesión en vivo pasa a leerlo: hasta entonces sólo lo mantenía
 * `trainings`. Sólo cubre el ejercicio, no las cuatro tablas que lo clasifican
 * —grupos musculares, patrones, equipamiento, objetivos—: ésas siguen siendo
 * cosa de `trainings` porque nadie más las mira.
 */
export interface ExerciseRepository {
  findAll(): Promise<Exercise[]>
  create(data: Omit<Exercise, 'id'>): Promise<Exercise>
  update(exerciseId: string, data: Omit<Exercise, 'id'>): Promise<void>
  remove(exerciseId: string): Promise<void>
  onChange(listener: () => void): () => void
}
