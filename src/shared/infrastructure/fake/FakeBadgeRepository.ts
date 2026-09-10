import type { BadgeRepository } from '@/shared/domain/ports/BadgeRepository'
import { BADGES_REQUIRING_VALIDATION, type StudentBadge } from '@/shared/domain/entities/progress'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { FakeSessionRepository } from './FakeSessionRepository'
import type { FakeStreakRepository } from './FakeStreakRepository'
import type { FakeStudentRepository } from './FakeStudentRepository'
import { unlockBadges } from './badgeRules'

/**
 * Las insignias simuladas: se derivan de la historia en cada lectura, con las
 * mismas reglas que `evaluate_badges`. Lo que no se deriva -las confirmadas
 * por el entrenador, y las que da una validacion- vive en memoria encima.
 */
export class FakeBadgeRepository implements BadgeRepository {
  private readonly sessions: FakeSessionRepository
  private readonly students: FakeStudentRepository
  private readonly streaks: FakeStreakRepository
  private readonly scope: CrewScope
  private readonly validated = new Map<string, string>()
  private readonly granted = new Map<string, StudentBadge>()
  private readonly listeners = new Set<() => void>()

  constructor(
    sessions: FakeSessionRepository,
    students: FakeStudentRepository,
    streaks: FakeStreakRepository,
    scope: CrewScope
  ) {
    this.sessions = sessions
    this.students = students
    this.streaks = streaks
    this.scope = scope
  }

  private badgesOf(studentId: string): StudentBadge[] {
    const history = this.sessions.listAll().filter((session) => session.studentId === studentId)
    const derived = unlockBadges(studentId, history, this.streaks.pausesOfSync(studentId))
    const extra = [...this.granted.values()].filter((badge) => badge.studentId === studentId)
    return [...derived, ...extra].map((badge) => ({
      ...badge,
      validatedAt: this.validated.get(`${studentId}:${badge.code}`) ?? badge.validatedAt,
    }))
  }

  async unlockedOf(studentId: string): Promise<StudentBadge[]> {
    return this.badgesOf(studentId)
  }

  async newIn(sessionId: string): Promise<StudentBadge[]> {
    const session = this.sessions.listAll().find((candidate) => candidate.id === sessionId)
    if (session === undefined || session.studentId === null) return []
    return this.badgesOf(session.studentId).filter((badge) => badge.sessionId === sessionId)
  }

  async pendingValidation(): Promise<StudentBadge[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []
    return this.students
      .membersOf(crewId)
      .flatMap((student) => this.badgesOf(student.id))
      .filter((badge) => BADGES_REQUIRING_VALIDATION.includes(badge.code) && badge.validatedAt === null)
  }

  async validate(studentId: string, code: string): Promise<void> {
    this.validated.set(`${studentId}:${code}`, new Date().toISOString())
    this.notify()
  }

  /** Lo que da una validacion de hito, no una sesion. Lo llama la ruta simulada. */
  grant(studentId: string, code: string): void {
    const key = `${studentId}:${code}`
    if (this.granted.has(key)) return
    this.granted.set(key, {
      studentId,
      code,
      unlockedOn: new Date().toISOString().slice(0, 10),
      sessionId: null,
      validatedAt: null,
    })
    this.notify()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    const unsubscribeSessions = this.sessions.onChange(listener)
    const unsubscribeStreaks = this.streaks.onChange(listener)
    return () => {
      this.listeners.delete(listener)
      unsubscribeSessions()
      unsubscribeStreaks()
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
