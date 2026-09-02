import type { NewNotice, NoticeRepository } from '@/shared/domain/ports/NoticeRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { Notice } from '@/shared/domain/entities/notice'

/**
 * Avisos simulados.
 *
 * Empieza vacio a proposito, al reves que las demas semillas: un aviso es algo
 * que alguien manda, y sembrar recordatorios de cuota que nadie ha escrito haria
 * que la campana naciera con deuda inventada.
 *
 * TODO: los datos viven solo en memoria. Al recargar se pierden.
 */
export class FakeNoticeRepository implements NoticeRepository {
  private notices: Notice[] = []
  private readonly listeners = new Set<() => void>()
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findForStudent(studentId: string): Promise<Notice[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    return this.notices
      .filter((notice) => notice.crewId === crewId && notice.studentId === studentId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }

  async send(data: NewNotice): Promise<Notice> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new Error('No hay ningun crew activo: un aviso pertenece a un equipo.')
    }

    const notice: Notice = {
      id: crypto.randomUUID(),
      crewId,
      ...data,
      createdAt: new Date().toISOString(),
      // Nace sin leer: es lo que enciende el contador de la campana.
      readAt: null,
    }

    this.notices = [notice, ...this.notices]
    this.notify()
    return notice
  }

  async markAllRead(studentId: string): Promise<void> {
    const readAt = new Date().toISOString()

    this.notices = this.notices.map((notice) =>
      notice.studentId === studentId && notice.readAt === null ? { ...notice, readAt } : notice
    )
    this.notify()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
