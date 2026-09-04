import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { NewRoutine, RoutineRepository } from '@/shared/domain/ports/RoutineRepository'
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

  // Campo declarado y asignado, no propiedad de parametro: `erasableSyntaxOnly`
  // esta activo en el `tsconfig`, y esa azucar de TypeScript emite codigo.
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<Routine[]> {
    return this.inScope()
  }

  async findById(routineId: string): Promise<Routine | null> {
    return this.inScope().find((routine) => routine.id === routineId) ?? null
  }

  async create(data: NewRoutine): Promise<Routine> {
    const crewId = this.scope.current()
    if (crewId === null) {
      // Escribir sin crew dejaria un huerfano invisible: no lo veria nadie,
      // porque toda lectura esta acotada. Mejor fallar aqui que guardar algo
      // que despues no aparece y nadie sabe por que.
      throw new Error('No hay ningun crew activo.')
    }

    const routine: Routine = { id: crypto.randomUUID(), crewId, ...data }
    // Delante: el entrenador acaba de crearla y espera verla, no buscarla
    // debajo de las de ejemplo.
    this.routines = [routine, ...this.routines]
    this.notify()
    return routine
  }

  async update(routineId: string, data: NewRoutine): Promise<void> {
    // Se conserva la posición en la lista: editar una rutina no la crea de
    // nuevo, así que no debe saltar al principio.
    this.routines = this.routines.map((routine) =>
      // `crewId` se conserva: editar una rutina no la mueve de crew.
      routine.id === routineId ? { ...routine, ...data } : routine
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

  /**
   * Lo que pertenece al crew activo.
   *
   * Sin crew activo devuelve vacio, y no todo: es el caso de una cuenta recien
   * registrada, y enseñarle los datos de otro equipo seria justo el fallo de
   * aislamiento que la multi-tenencia existe para evitar. Es lo que hara
   * Postgres con RLS cuando exista; ver `CrewScope`.
   */
  private inScope(): Routine[] {
    const crewId = this.scope.current()
    if (crewId === null) return []
    return this.routines.filter((entrada) => entrada.crewId === crewId)
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
