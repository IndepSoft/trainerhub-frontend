import type { RoutineRepository } from '@/shared/domain/ports/RoutineRepository'
import type { Routine } from '@/shared/domain/entities/routine'
import { routinesSeed } from './routinesSeed'

/**
 * Rutinas simuladas mientras no hay backend.
 *
 * Guarda la colección en la propia instancia y no en un módulo: el contenedor
 * crea una sola, así que el estado es único, y no queda una variable global que
 * cualquiera pueda mutar por su cuenta.
 *
 * Devuelve promesas aunque los datos sean síncronos: la forma del puerto tiene
 * que ser la misma que tendrá con red, o cambiar de adaptador obligaría a tocar
 * a todos los consumidores. Mismo criterio que `FakeStudentRepository`.
 *
 * TODO: los datos viven sólo en memoria. Al recargar vuelve la semilla, y la
 * rutina creada desaparece. No se persiste en `localStorage` a propósito: sería
 * fingir un backend, y el día que llegue el de verdad habría que decidir qué
 * hacer con lo que quedó guardado en los navegadores.
 */
export class FakeRoutineRepository implements RoutineRepository {
  private routines: Routine[] = routinesSeed
  private readonly listeners = new Set<() => void>()

  async findAll(): Promise<Routine[]> {
    return this.routines
  }

  async findById(routineId: string): Promise<Routine | null> {
    return this.routines.find((routine) => routine.id === routineId) ?? null
  }

  async create(data: Omit<Routine, 'id'>): Promise<Routine> {
    const routine: Routine = { id: crypto.randomUUID(), ...data }
    // Delante: el entrenador acaba de crearla y espera verla, no buscarla
    // debajo de las de ejemplo.
    this.routines = [routine, ...this.routines]
    this.notify()
    return routine
  }

  async update(routineId: string, data: Omit<Routine, 'id'>): Promise<void> {
    // Se conserva la posición en la lista: editar una rutina no la crea de
    // nuevo, así que no debe saltar al principio.
    this.routines = this.routines.map((routine) =>
      routine.id === routineId ? { id: routineId, ...data } : routine
    )
    this.notify()
  }

  async remove(routineId: string): Promise<void> {
    this.routines = this.routines.filter((routine) => routine.id !== routineId)
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
