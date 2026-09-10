import { describe, expect, it } from 'vitest'
import { protectedStreak, wildcardsAvailable, weeksInARow } from '@/shared/infrastructure/fake/streakRules'
import { streakFrom } from '@/domains/progress/libs/progressRules'
import { cohortOf } from '@/shared/domain/entities/progress'
import type { Session } from '@/shared/domain/entities/session'
import type { StreakPause } from '@/shared/domain/entities/progress'

/**
 * La racha protegida: pausas y descansos programados no la rompen. El
 * espejo simulado y la presentacion tienen que decir lo mismo; lo que hace
 * la base lo afirma `tests/contract/streaks.contract.test.ts`.
 */

function session(id: string, date: string, status: Session['status'], assignmentId?: string): Session {
  return {
    id,
    crewId: 'crew-1',
    title: id,
    studentId: 'student-1',
    kind: 'individual',
    modality: 'strength',
    category: '',
    date,
    time: '09:00',
    durationMinutes: 60,
    location: '',
    status,
    notes: '',
    routineId: null,
    assignmentId,
    result:
      status === 'completed'
        ? { completedSets: 3, totalSets: 3, elapsedSeconds: 1800, completedAt: date }
        : null,
  }
}

const pause = (fromDay: string, toDay: string, reason: StreakPause['reason'] = 'injury'): StreakPause => ({
  studentId: 'student-1',
  fromDay,
  toDay,
  reason,
})

describe('protectedStreak: lo que no rompe la racha', () => {
  it('un hueco sin cubrir rompe; una pausa lo salta sin sumar', () => {
    const sessions = [
      session('a', '2026-09-01', 'completed'),
      session('b', '2026-09-02', 'completed'),
      session('c', '2026-09-05', 'completed'),
    ]
    expect(protectedStreak(sessions, [], '2026-09-05')).toBe(1)
    expect(protectedStreak(sessions, [pause('2026-09-03', '2026-09-04')], '2026-09-05')).toBe(3)
  })

  it('el descanso programado de un plan volcado tampoco rompe', () => {
    const sessions = [
      session('a', '2026-09-01', 'completed', 'dump-1'),
      session('b', '2026-09-03', 'completed', 'dump-1'),
      session('c', '2026-09-05', 'pending', 'dump-1'),
    ]
    // El 2 y el 4 son descanso del plan: hay sesiones del mismo volcado antes y despues.
    expect(protectedStreak(sessions, [], '2026-09-03')).toBe(2)
    // Sin volcado, el 2 es un dia perdido.
    const loose = sessions.map((candidate) => ({ ...candidate, assignmentId: undefined }))
    expect(protectedStreak(loose, [], '2026-09-03')).toBe(1)
  })

  it('la presentacion dice lo mismo que el espejo', () => {
    const sessions = [
      session('a', '2026-09-06', 'completed'),
      session('b', '2026-09-07', 'completed'),
      session('c', '2026-09-09', 'completed'),
    ]
    const pauses = [pause('2026-09-08', '2026-09-08', 'wildcard')]
    const today = new Date(2026, 8, 9)
    // Tres dias entrenados: el comodin salta el 8 pero no lo suma.
    expect(streakFrom(sessions, today, pauses).currentDays).toBe(3)
    expect(streakFrom(sessions, today, []).currentDays).toBe(1)
    expect(protectedStreak(sessions, pauses, '2026-09-09')).toBe(3)
  })
})

describe('wildcardsAvailable: uno por cada ocho semanas, hasta dos, menos los gastados', () => {
  const today = new Date(2026, 8, 9)
  const weekly = (weeks: number): Session[] =>
    Array.from({ length: weeks }, (_, index) => {
      const date = new Date(2026, 8, 7 - index * 7)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      return session(`w${index}`, key, 'completed')
    })

  it('cuenta semanas seguidas y descuenta los comodines de las ultimas dieciseis', () => {
    expect(weeksInARow(weekly(9), today)).toBe(9)
    expect(wildcardsAvailable(weekly(7), [], today)).toBe(0)
    expect(wildcardsAvailable(weekly(9), [], today)).toBe(1)
    expect(wildcardsAvailable(weekly(20), [], today)).toBe(2)
    expect(wildcardsAvailable(weekly(20), [pause('2026-08-30', '2026-08-30', 'wildcard')], today)).toBe(1)
    expect(wildcardsAvailable(weekly(20), [pause('2026-01-10', '2026-01-10', 'wildcard')], today)).toBe(2)
  })
})

describe('cohortOf: con nombre y sin edad', () => {
  const today = new Date(2026, 8, 9)
  it('juvenil, adulto, senior; sin fecha, nada', () => {
    expect(cohortOf('2011-01-01', today)).toBe('youth')
    expect(cohortOf('1996-01-01', today)).toBe('adult')
    expect(cohortOf('1966-01-01', today)).toBe('senior')
    expect(cohortOf(null, today)).toBeNull()
  })
})
