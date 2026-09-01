import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { NewSession, SessionRepository } from '@/shared/domain/ports/SessionRepository'
import type { Session, SessionResult, SessionStatus } from '@/shared/domain/entities/session'
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

  // Campo declarado y asignado, no propiedad de parametro: `erasableSyntaxOnly`
  // esta activo en el `tsconfig`, y esa azucar de TypeScript emite codigo.
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<Session[]> {
    return this.inScope()
  }

  async findById(sessionId: string): Promise<Session | null> {
    return this.inScope().find((session) => session.id === sessionId) ?? null
  }

  async findByStudent(studentId: string): Promise<Session[]> {
    return this.inScope()
      .filter((session) => session.studentId === studentId)
      .sort(compareByStartInstant)
  }

  async findByDate(date: string): Promise<Session[]> {
    return this.inScope().filter((session) => session.date === date).sort(compareByStartInstant)
  }

  async findBetween(from: string, to: string): Promise<Session[]> {
    // `YYYY-MM-DD` ordena bien como texto, asi que el intervalo se compara sin
    // construir ninguna fecha.
    return this.inScope()
      .filter((session) => session.date >= from && session.date <= to)
      .sort(compareByStartInstant)
  }

  async create(data: NewSession): Promise<Session> {
    const crewId = this.scope.current()
    if (crewId === null) {
      // Escribir sin crew dejaria un huerfano invisible: no lo veria nadie,
      // porque toda lectura esta acotada. Mejor fallar aqui que guardar algo
      // que despues no aparece y nadie sabe por que.
      throw new Error('No hay ningun crew activo.')
    }

    const session: Session = { id: crypto.randomUUID(), crewId, ...data }
    this.sessions = [...this.sessions, session]
    this.notify()
    return session
  }

  async update(sessionId: string, data: NewSession): Promise<void> {
    this.sessions = this.sessions.map((session) =>
      // `crewId` se conserva: editar una sesion no la mueve de crew.
      session.id === sessionId ? { ...session, ...data } : session
    )
    this.notify()
  }

  async updateStatus(sessionId: string, status: SessionStatus): Promise<void> {
    this.sessions = this.sessions.map((session) =>
      session.id === sessionId ? { ...session, status } : session
    )
    this.notify()
  }

  async complete(sessionId: string, result: SessionResult): Promise<void> {
    this.sessions = this.sessions.map((session) =>
      session.id === sessionId ? { ...session, status: 'completed', result } : session
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

  /**
   * Lo que pertenece al crew activo.
   *
   * Sin crew activo devuelve vacio, y no todo: es el caso de una cuenta recien
   * registrada, y enseñarle los datos de otro equipo seria justo el fallo de
   * aislamiento que la multi-tenencia existe para evitar. Es lo que hara
   * Postgres con RLS cuando exista; ver `CrewScope`.
   */
  private inScope(): Session[] {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const inCrew = this.sessions.filter((entrada) => entrada.crewId === crewId)

    const studentId = this.scope.asStudent()
    if (studentId === null) return inCrew

    /*
     * Un alumno ve las SUYAS y las de grupo, no las de sus compañeros.
     *
     * Las de grupo -`studentId` a `null`- son de todo el equipo por definición,
     * así que ocultarlas dejaría fuera justo lo que va a la agenda común. Las
     * individuales de otro no son asunto suyo: quién entrena, cuándo y dónde.
     */
    return inCrew.filter(
      (entrada) => entrada.studentId === studentId || entrada.studentId === null
    )
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
