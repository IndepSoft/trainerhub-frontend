/**
 * Objetivos que se le pueden marcar a un alumno.
 *
 * Lista cerrada y no texto libre: los objetivos se usan para filtrar y agrupar,
 * y escritos a mano cada ficha pondria el suyo -«bajar peso», «perder peso»,
 * «adelgazar»- y el filtro dejaria de servir. Es el mismo motivo por el que los
 * grupos musculares del catalogo tampoco se editan.
 *
 * LO QUE HAY AQUI ES EL VALOR QUE SE GUARDA, no lo que se lee en pantalla. Se
 * queda en castellano a proposito: es la identidad del objetivo, y si cambiara
 * con el idioma de quien lo marca, dos fichas con el mismo objetivo dejarian de
 * agruparse. El rotulo traducido lo pone `GOAL_LABEL_KEY`, en la capa de
 * idiomas. Es el mismo reparto que `StudentLevel`.
 *
 * TODO: producto deberia revisar la lista. Salio de los objetivos que ya
 * aparecian en la semilla de estudiantes, no de un catalogo pensado.
 */
export const STUDENT_GOALS: string[] = [
  'Perder peso',
  'Ganar músculo',
  'Ganar fuerza',
  'Mejorar resistencia',
  'Movilidad',
  'Rehabilitación',
  'Salud general',
]
