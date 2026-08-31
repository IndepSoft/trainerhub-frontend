import { create } from 'zustand'
import { routinesMock } from '../data/routines.mock'
import type { Routine } from '../types/training.types'

interface RoutinesState {
  routines: Routine[]
  /** Guarda una rutina nueva y devuelve la ya identificada. */
  createRoutine: (data: Omit<Routine, 'id'>) => Routine
}

/**
 * Colección de rutinas de la sesión.
 *
 * POR QUÉ UN ALMACÉN Y NO UN PUERTO
 *
 * El `TODO` de `routines.mock.ts` pedía un `RoutineRepository` en
 * `shared/domain/ports`, copiando lo que se hizo con estudiantes. No se ha
 * hecho, y el motivo lo escribe el propio proyecto en
 * `shared/domain/entities/student.ts`: una entidad sube a la capa compartida
 * cuando la necesitan DOS dominios. `Student` subió porque el calendario tiene
 * que ofrecer la lista de alumnos al agendar. `Routine` hoy sólo la usa
 * `trainings` —`Session` no tiene ni un campo que apunte a una rutina—, así que
 * moverla a `shared` para poder declarar el puerto ahí sería repetir la forma
 * del patrón sin su razón.
 *
 * El día que la agenda pueda colgar una rutina de una sesión, la entidad cruza
 * dominios, sube a `shared/domain/entities`, el puerto nace en
 * `shared/domain/ports` y este almacén se convierte en su adaptador falso. Ese
 * día se toca este fichero y ninguno de los que lo consumen.
 *
 * POR QUÉ NO UN ARRAY MUTABLE SUELTO
 *
 * Bastaría para el flujo actual —crear y navegar al detalle remonta las
 * páginas—, pero nadie quedaría suscrito: una lista ya montada no se enteraría
 * de la rutina nueva. Es la clase de cosa que funciona hasta que dos vistas
 * conviven en pantalla. `zustand` ya es dependencia del proyecto y es el
 * mecanismo que `app/stores/authStore.ts` estableció para estado compartido.
 *
 * TODO: los datos viven sólo en memoria. Al recargar vuelve la semilla y la
 * rutina creada desaparece. No se persiste en `localStorage` a propósito: sería
 * fingir un backend, y el día que llegue el de verdad habría que decidir qué
 * hacer con lo que quedó guardado en los navegadores.
 */
export const useRoutinesStore = create<RoutinesState>((set) => ({
  routines: routinesMock,

  createRoutine: (data) => {
    const routine: Routine = { id: crypto.randomUUID(), ...data }
    // Delante y no al final: el entrenador acaba de crearla y espera verla, no
    // buscarla debajo de las cuatro de ejemplo.
    set((state) => ({ routines: [routine, ...state.routines] }))
    return routine
  },
}))
