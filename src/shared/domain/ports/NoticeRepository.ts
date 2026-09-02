import type { Notice, NoticeKind } from '../entities/notice'

/**
 * Puerto de los avisos privados.
 *
 * Acotado al crew activo. Ver `CrewScope`.
 */
export interface NoticeRepository {
  /**
   * Los avisos dirigidos a un alumno, del más nuevo al más viejo.
   *
   * Por destinatario y no «todos los del crew»: un aviso es entre dos personas,
   * y un método que los devolviera todos sería una puerta abierta a leer los de
   * los demás. Con RLS, la política es `student_id` = la ficha de quien pregunta.
   */
  findForStudent(studentId: string): Promise<Notice[]>

  send(data: NewNotice): Promise<Notice>

  /** Marca como leídos los de un alumno. Apaga el contador de la campana. */
  markAllRead(studentId: string): Promise<void>

  onChange(listener: () => void): () => void
}

/** Un aviso nuevo. Sin `crewId` —lo pone el ámbito— ni `readAt`, que nace sin leer. */
export interface NewNotice {
  studentId: string
  kind: NoticeKind
  body: string
}
