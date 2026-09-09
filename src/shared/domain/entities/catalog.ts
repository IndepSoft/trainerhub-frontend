/**
 * El catálogo del entrenamiento: las cinco tablas de referencia.
 *
 * VIVÍAN EN `domains/trainings/types/catalog.types.ts` Y SUBEN POR EL MISMO
 * CRITERIO QUE TODO LO DEMÁS: un puerto en `shared/domain` no puede importar de
 * un dominio, y el catálogo pasa a tener puerto porque el material que da de
 * alta un entrenador se perdía al recargar —vivía en un almacén de `zustand` sin
 * adaptador—. `catalog.types.ts` los reexporta para que el dominio siga teniendo
 * un solo sitio donde mirar sus tipos.
 *
 * Cuatro de las cinco son VOCABULARIO DEL SISTEMA: se sirven iguales para todos
 * y no se editan desde la aplicación. El material es la excepción: hay uno de
 * sistema y hay el que añade cada equipo, y conviven en la misma lista.
 */

export interface MuscleGroup {
  id: string
  name: string
  region: 'tren superior' | 'tren inferior' | 'core'
}

export interface MovementPattern {
  id: string
  name: string
}

export interface Equipment {
  id: string
  name: string
  kind: 'peso libre' | 'máquina' | 'accesorio' | 'peso corporal'
}

export interface TrainingObjective {
  id: string
  name: string
  description: string
}

export interface TrainingSplit {
  id: string
  name: string
  description: string
  sessionsPerWeek: number
}

/** Las cinco tablas juntas: se piden de una vez porque se resuelven a la vez. */
export interface TrainingCatalog {
  muscleGroups: MuscleGroup[]
  movementPatterns: MovementPattern[]
  equipment: Equipment[]
  objectives: TrainingObjective[]
  splits: TrainingSplit[]
}
