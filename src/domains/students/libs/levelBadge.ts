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

/**
 * El mismo nivel, sobre el bloque de Ink de la tarjeta editorial.
 *
 * Los tonos de `--scale-*` estan calibrados contra el fondo Bone; sobre Ink
 * pierden contraste. Se sube la opacidad del canto y el texto pasa a un tono mas
 * claro de la misma rampa en vez de cambiar de color, que rompería la
 * asociación nivel-color entre la ficha y la tarjeta.
 */
export const LEVEL_BADGE_ON_INK: Record<StudentLevel, string> = {
  Principiante: 'border-scale-1/60 text-scale-1',
  Intermedio: 'border-scale-2/60 text-scale-2',
  Avanzado: 'border-scale-3/60 text-scale-3',
}
