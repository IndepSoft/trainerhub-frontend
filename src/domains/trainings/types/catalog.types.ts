/**
 * EL CATÁLOGO YA NO VIVE AQUÍ. Subió a `shared/domain/entities/catalog.ts`
 * cuando pasó a tener puerto: el material que da de alta un entrenador vivía en
 * un almacén de `zustand` y se perdía al recargar, y un puerto en `shared` no
 * puede importar de un dominio. Se reexporta para que este dominio siga
 * teniendo un solo sitio donde mirar sus tipos.
 */
export type {
  Equipment,
  MovementPattern,
  MuscleGroup,
  TrainingCatalog,
  TrainingObjective,
  TrainingSplit,
} from '@/shared/domain/entities/catalog'
