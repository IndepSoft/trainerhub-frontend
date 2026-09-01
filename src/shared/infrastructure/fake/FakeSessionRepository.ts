import type { SessionRepository } from '@/shared/domain/ports/SessionRepository'
import type { Session, SessionStatus } from '@/shared/domain/entities/session'
import { sessionsSeed } from './sessionsSeed'

/**
 * Sesiones simuladas mientras no hay backend.
 *
 * Misma forma y mismo razonamiento que `FakeRoutineRepository`: el estado vive
 * en la instancia, el contenedor crea una sola, y las promesas están aunque los
 * datos sean síncronos porque el puerto tiene que tener la forma que tendrá con
 * red.
 *
 * TODO: los datos viven sólo en memoria. Al recargar vuelve la semilla.
 */
export class FakeSessionRepository implements SessionRepository {
  private sessions: Session[] = sessionsSeed
  private readonly listeners = new Set<() => void>()

  async findAll(): Promise<Session[]> {
    return this.sessions
  }

  async findByStudent(studentId: string): Promise<Session[]> {
    return this.sessions
      .filter((session) => session.studentId === studentId)
      .sort(compareByStartInstant)
  }

  async findByDate(date: string): Promise<Session[]> {
    return this.sessions.filter((session) => session.date === date).sort(compareByStartInstant)
  }

  async findBetween(from: string, to: string): Promise<Session[]> {
    // `YYYY-MM-DD` ordena bien como texto, asi que el intervalo se compara sin
    // construir ninguna fecha.
    return this.sessions
      .filter((session) => session.date >= from && session.date <= to)
      .sort(compareByStartInstant)
  }

  async create(data: Omit<Session, 'id'>): Promise<Session> {
    const session: Session = { id: crypto.randomUUID(), ...data }
    this.sessions = [...this.sessions, session]
    this.notify()
    return session
  }

  async update(sessionId: string, data: Omit<Session, 'id'>): Promise<void> {
    this.sessions = this.sessions.map((session) =>
      session.id === sessionId ? { id: sessionId, ...data } : session
    )
    this.notify()
  }

  async updateStatus(sessionId: string, status: SessionStatus): Promise<void> {
    this.sessions = this.sessions.map((session) =>
      session.id === sessionId ? { ...session, status } : session
    )
    this.notify()
  }

  async remove(sessionId: string): Promise<void> {
    this.sessions = this.sessions.filter((session) => session.id !== sessionId)
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

/**
 * Orden cronológico.
 *
 * `date` es `YYYY-MM-DD` y `time` es `HH:mm`, dos formatos que ordenan bien como
 * texto, así que concatenarlos da el instante sin construir una `Date` —que
 * además habría que construir en la zona correcta para no desplazar sesiones de
 * madrugada al día anterior—.
 */
function compareByStartInstant(left: Session, right: Session): number {
  return `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`)
}
