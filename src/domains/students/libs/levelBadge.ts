import type { StudentLevel } from '../types/student.types'

/**
 * Presentación de cada nivel.
 *
 * Vive aquí y no dentro de un componente porque la usan dos: la tarjeta de la
 * lista y la ficha del estudiante. Duplicarla haría que un cambio de color
 * tuviera que acertarse en dos sitios, que es exactamente cómo llegaron a
 * divergir las escalas de `students` y `trainings`.
 *
 * Rampa `--scale-*`, fuera de la marca a propósito: si «Intermedio» usara
 * Cobalt, una etiqueta de nivel se leería como un botón primario.
 */
export const LEVEL_BADGE: Record<StudentLevel, string> = {
  Principiante: 'border-scale-1/50 text-scale-1',
  Intermedio: 'border-scale-2/50 text-scale-2',
  Avanzado: 'border-scale-3/50 text-scale-3',
}
