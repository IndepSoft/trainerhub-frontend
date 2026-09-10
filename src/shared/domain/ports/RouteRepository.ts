import type { ProgressRouteCode, RouteProgress } from '../entities/progress'

/**
 * Puerto de las rutas de desarrollo.
 *
 * Lo que se lee sale calculado del servidor —`route_progress`— y lo que se
 * escribe pasa por funciones que comprueban `students.manage`: elegir la ruta
 * a mano y validar un hito son decisiones de quien entrena, y la base no deja
 * que nadie más las tome.
 */
export interface RouteRepository {
  /** Dónde está el alumno: ruta, nodo, puntos, semanas y validaciones. */
  progressOf(studentId: string): Promise<RouteProgress>

  /** Cambia la ruta a mano. Los puntos de la ruta cuentan desde ahora. */
  choose(studentId: string, route: ProgressRouteCode): Promise<void>

  /** Valida el hito de un nodo. Sin esto no se pasa de nodo, aunque los números den. */
  validateMilestone(input: MilestoneValidationInput): Promise<void>

  /** Avisa de que algo ha cambiado. Devuelve la función de baja. */
  onChange(listener: () => void): () => void
}

export interface MilestoneValidationInput {
  studentId: string
  route: ProgressRouteCode
  position: number
  notes: string
}
