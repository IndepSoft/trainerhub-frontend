import type { Block } from './routine'

/**
 * Un bloque guardado para reutilizarlo.
 *
 * SUBE DESDE `domains/trainings/types/training.types.ts` porque pasa a tener
 * puerto: la biblioteca vivía en un almacén de `zustand` sin adaptador y se
 * vaciaba al recargar. `training.types.ts` lo reexporta.
 *
 * SE COPIA AL INSERTAR, NO SE REFERENCIA. Es la decisión de fondo de la
 * biblioteca, y va al revés que el ejercicio: el ejercicio se referencia por
 * identificador —si cambia de nombre, cambia en todas partes— y el bloque se
 * copia. Si una rutina apuntara a la entrada de la biblioteca, editarla
 * cambiaría en silencio el programa que un alumno está haciendo esta semana.
 * La regla que ordena las dos: se referencia el vocabulario, se copia la
 * decisión.
 *
 * Consecuencia buscada: borrar una entrada no rompe ninguna rutina, y por eso,
 * a diferencia del catálogo de ejercicios, este borrado no necesita protección.
 */
export interface SavedBlock {
  id: string
  /** Se genera del contenido al guardar y se puede renombrar después. */
  name: string
  block: Block
}
