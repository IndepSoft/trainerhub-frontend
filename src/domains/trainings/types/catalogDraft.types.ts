import type { Equipment } from './catalog.types'

/**
 * El ejercicio mientras se está escribiendo.
 *
 * `instructions` es UNA cadena y no el `string[]` de la entidad: en el
 * formulario es un área de texto con una instrucción por línea. Modelarlo como
 * array obligaría a decidir qué es una fila vacía mientras se teclea —¿un paso
 * en blanco, o nada?— y a rehacer el estado en cada pulsación de Intro. El
 * troceo ocurre una vez, al guardar.
 *
 * Mismo criterio que `RoutineDraft`: el borrador tiene la forma del formulario,
 * no la de la entidad.
 */
export interface ExerciseDraft {
  name: string
  description: string
  equipmentId: string
  movementPatternId: string
  primaryMuscleGroupId: string
  secondaryMuscleGroupIds: string[]
  instructions: string
}

export interface ExerciseDraftErrors {
  name?: string
  equipmentId?: string
  movementPatternId?: string
  primaryMuscleGroupId?: string
}

/** El material es tan corto que se edita en la propia fila, sin diálogo. */
export interface EquipmentDraft {
  name: string
  kind: Equipment['kind']
}
