import type { StudentBadge } from '../entities/progress'

/**
 * Puerto de las insignias conseguidas.
 *
 * SÓLO LECTURA desde la aplicación: las desbloquea el servidor al cerrar la
 * sesión, y las confirma —Platino y Diamante— quien gestiona alumnos, que es
 * otra operación y llega en su fase. El catálogo de lo que existe vive en el
 * dominio de progreso; aquí viaja el código.
 */
export interface BadgeRepository {
  /** Todas las de un alumno, de la más reciente a la más antigua. */
  unlockedOf(studentId: string): Promise<StudentBadge[]>

  /** Las que desbloqueó UNA sesión. Es lo que celebra la pantalla de cierre. */
  newIn(sessionId: string): Promise<StudentBadge[]>

  /** Avisa de que algo ha cambiado. Devuelve la función de baja. */
  onChange(listener: () => void): () => void
}
