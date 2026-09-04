import type { ExerciseRepository } from '@/shared/domain/ports/ExerciseRepository'
import type { Exercise } from '@/shared/domain/entities/exercise'
import { exercisesSeed } from './exercisesSeed'

/**
 * Catalogo de ejercicios simulado. Misma forma que el resto de adaptadores
 * falsos.
 *
 * TODO: los datos viven solo en memoria. Al recargar vuelve la semilla.
 */
export class FakeExerciseRepository implements ExerciseRepository {
  private exercises: Exercise[] = exercisesSeed
  private readonly listeners = new Set<() => void>()

  async findAll(): Promise<Exercise[]> {
    return this.exercises
  }

  async create(data: Omit<Exercise, 'id'>): Promise<Exercise> {
    const exercise: Exercise = { id: crypto.randomUUID(), ...data }
    this.exercises = [exercise, ...this.exercises]
    this.notify()
    return exercise
  }

  async update(exerciseId: string, data: Omit<Exercise, 'id'>): Promise<void> {
    this.exercises = this.exercises.map((exercise) =>
      exercise.id === exerciseId ? { id: exerciseId, ...data } : exercise
    )
    this.notify()
  }

  async remove(exerciseId: string): Promise<void> {
    this.exercises = this.exercises.filter((exercise) => exercise.id !== exerciseId)
    this.notify()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
