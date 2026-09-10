import type { StreakPauseInput, StreakRepository } from '@/shared/domain/ports/StreakRepository'
import type { StreakPause } from '@/shared/domain/entities/progress'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import type { FakeSessionRepository } from './FakeSessionRepository'
import { wildcardsAvailable } from './streakRules'

/**
 * Las pausas de racha simuladas, en memoria. Los comodines se cuentan cada
 * vez con la misma regla que `wildcards_available`.
 */
export class FakeStreakRepository implements StreakRepository {
  private readonly sessions: FakeSessionRepository
  private pauses: StreakPause[] = []
  private readonly listeners = new Set<() => void>()

  constructor(sessions: FakeSessionRepository) {
    this.sessions = sessions
  }

  /** Sin promesa: lo leen las insignias simuladas al derivar la racha. */
  pausesOfSync(studentId: string): StreakPause[] {
    return this.pauses.filter((pause) => pause.studentId === studentId)
  }

  async pausesOf(studentId: string): Promise<StreakPause[]> {
    return this.pausesOfSync(studentId)
  }

  async wildcardsAvailable(studentId: string): Promise<number> {
    const own = this.sessions.listAll().filter((session) => session.studentId === studentId)
    return wildcardsAvailable(own, this.pausesOfSync(studentId))
  }

  async pause(input: StreakPauseInput): Promise<void> {
    this.pauses = [
      ...this.pauses.filter(
        (pause) => !(pause.studentId === input.studentId && pause.fromDay === input.fromDay)
      ),
      { studentId: input.studentId, fromDay: input.fromDay, toDay: input.toDay, reason: input.reason },
    ]
    this.notify()
  }

  async useWildcard(studentId: string, day: string): Promise<void> {
    if (day >= toLocalDateKey(new Date())) {
      throw new AppError(AppErrorCode.VALIDATION, 'invalidReference')
    }
    if ((await this.wildcardsAvailable(studentId)) <= 0) {
      throw new AppError(AppErrorCode.VALIDATION, 'noWildcards')
    }
    if (this.pausesOfSync(studentId).some((pause) => pause.fromDay === day)) return
    this.pauses = [...this.pauses, { studentId, fromDay: day, toDay: day, reason: 'wildcard' }]
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
