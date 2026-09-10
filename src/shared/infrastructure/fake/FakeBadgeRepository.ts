import type { BadgeRepository } from '@/shared/domain/ports/BadgeRepository'
import type { StudentBadge } from '@/shared/domain/entities/progress'
import type { FakeSessionRepository } from './FakeSessionRepository'
import { unlockBadges } from './badgeRules'

/**
 * Las insignias simuladas: se derivan de la historia en cada lectura, con las
 * mismas reglas que `evaluate_badges`. Ver `FakeScoreRepository`.
 */
export class FakeBadgeRepository implements BadgeRepository {
  private readonly sessions: FakeSessionRepository

  constructor(sessions: FakeSessionRepository) {
    this.sessions = sessions
  }

  private badgesOf(studentId: string): StudentBadge[] {
    const history = this.sessions.listAll().filter((session) => session.studentId === studentId)
    return unlockBadges(studentId, history)
  }

  async unlockedOf(studentId: string): Promise<StudentBadge[]> {
    return this.badgesOf(studentId)
  }

  async newIn(sessionId: string): Promise<StudentBadge[]> {
    const session = this.sessions.listAll().find((candidate) => candidate.id === sessionId)
    if (session === undefined || session.studentId === null) return []
    return this.badgesOf(session.studentId).filter((badge) => badge.sessionId === sessionId)
  }

  onChange(listener: () => void): () => void {
    return this.sessions.onChange(listener)
  }
}
