import type { StudentBadge } from '../entities/progress'

/**
 * Puerto de las insignias conseguidas.
 *
 * Las desbloquea el servidor al cerrar la sesión; la aplicación sólo las lee,
 * salvo una escritura: confirmarlas —Platino y Diamante—, que hace quien
 * gestiona alumnos por una función que comprueba la capacidad. El catálogo de
 * lo que existe vive en el dominio de progreso; aquí viaja el código.
 */
export interface BadgeRepository {
  /** Todas las de un alumno, de la más reciente a la más antigua. */
  unlockedOf(studentId: string): Promise<StudentBadge[]>

  /** Las que desbloqueó UNA sesión. Es lo que celebra la pantalla de cierre. */
  newIn(sessionId: string): Promise<StudentBadge[]>

  /**
   * Las de todo el equipo activo que esperan confirmación del entrenador.
   * Platino y Diamante nacen así; el resto nunca aparece aquí.
   */
  pendingValidation(): Promise<StudentBadge[]>

  /** Confirma una. Sólo quien tiene `students.manage`; lo comprueba la base. */
  validate(studentId: string, code: string): Promise<void>

  /** Avisa de que algo ha cambiado. Devuelve la función de baja. */
  onChange(listener: () => void): () => void
}
