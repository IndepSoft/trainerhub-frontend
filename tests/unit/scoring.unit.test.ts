import { describe, expect, it } from 'vitest'
import { cohortFactor, progressFactor, scoreSession } from '@/shared/infrastructure/fake/scoring'
import { unlockBadges } from '@/shared/infrastructure/fake/badgeRules'
import type { Session, SetRecord } from '@/shared/domain/entities/session'
import type { Student } from '@/shared/domain/entities/student'

/**
 * El ESPEJO simulado de la regla de puntuacion y de las insignias.
 *
 * Lo que la base hace lo afirma `tests/contract/progress.contract.test.ts`;
 * esto afirma que la simulacion -de la que vive la suite de interfaz- dice lo
 * mismo con los mismos numeros. Si divergen, manda la base.
 */

function student(overrides: Partial<Student> = {}): Student {
  return {
    id: 'student-1',
    crewId: 'crew-1',
    firstName: 'Ana',
    lastName: 'Prueba',
    email: 'ana@prueba.local',
    level: 'Intermedio',
    goals: [],
    birthDate: null,
    bodyFatPercentage: 0,
    extraCapabilities: [],
    membershipStatus: 'active',
    profileId: null,
    ...overrides,
  }
}

function set(exerciseId: string, weightKg: number | undefined, rpe?: number): SetRecord {
  return {
    stepId: `${exerciseId}-1`,
    prescribedId: exerciseId,
    exerciseId,
    setNumber: 1,
    prescribedReps: '8',
    repsDone: 8,
    weightKg,
    rpe,
    workSeconds: 30,
    restSeconds: 60,
    prescribedRestSeconds: 60,
  }
}

function closed(
  id: string,
  completedAt: string,
  completedSets: number,
  totalSets: number,
  sets: SetRecord[] = [],
  overrides: Partial<Session> = {}
): Session {
  return {
    id,
    crewId: 'crew-1',
    title: id,
    studentId: 'student-1',
    kind: 'individual',
    modality: 'strength',
    category: '',
    date: completedAt,
    time: '09:00',
    durationMinutes: 60,
    location: '',
    status: 'completed',
    notes: '',
    routineId: null,
    result: { completedSets, totalSets, elapsedSeconds: 2700, completedAt, sets },
    ...overrides,
  }
}

const TODAY = new Date(2026, 8, 9)

describe('scoreSession: la regla 1, en memoria', () => {
  it('entera: base 20 + series, todo a 1', () => {
    const session = closed('s1', '2026-09-01', 9, 9)
    expect(scoreSession(session, [session], student(), TODAY)).toMatchObject({
      base: 29,
      adherence: 1,
      progress: 1,
      cohort: 1,
      points: 29,
      ruleVersion: 1,
    })
  })

  it('a medias baja al suelo de 0,80; pasarse no sube del techo de 1,10', () => {
    const half = closed('s2', '2026-09-02', 5, 12)
    expect(scoreSession(half, [half], student(), TODAY)).toMatchObject({ adherence: 0.8, points: 20 })

    const over = closed('s3', '2026-09-03', 14, 12)
    expect(scoreSession(over, [over], student(), TODAY)).toMatchObject({ base: 32, adherence: 1.1, points: 35 })
  })

  it('cardio puntua por minutos sobre la duracion prevista', () => {
    const run = closed('s4', '2026-09-04', 0, 0, [], {
      modality: 'cardio',
      result: { completedSets: 0, totalSets: 0, elapsedSeconds: 2400, completedAt: '2026-09-04' },
    })
    expect(scoreSession(run, [run], student(), TODAY)).toMatchObject({ base: 28, adherence: 0.8, points: 22 })
  })

  it('una grupal, o una sin cerrar, no puntua', () => {
    const group = closed('s5', '2026-09-05', 0, 0, [], { studentId: null, kind: 'group' })
    expect(scoreSession(group, [group], undefined, TODAY)).toBeNull()
    const open = closed('s6', '2026-09-06', 0, 0, [], { status: 'confirmed', result: null })
    expect(scoreSession(open, [open], student(), TODAY)).toBeNull()
  })
})

describe('progressFactor: mejorar la carga sobre la mediana de cuatro semanas', () => {
  const history = [
    closed('p1', '2026-08-10', 3, 3, [set('press', 60)]),
    closed('p2', '2026-08-17', 3, 3, [set('press', 62.5)]),
    closed('p3', '2026-08-24', 3, 3, [set('press', 65, 9)]),
    closed('p4', '2026-08-31', 3, 3, [set('press', 67.5, 8)]),
  ]

  it('sin referencia es 1; con mas carga limpia, 1,15; forzada, 1', () => {
    expect(progressFactor(history[0], history)).toBe(1)
    expect(progressFactor(history[1], history)).toBe(1.15)
    expect(progressFactor(history[2], history)).toBe(1)
    expect(progressFactor(history[3], history)).toBe(1.15)
  })

  it('una referencia de hace mas de cuatro semanas no cuenta', () => {
    const old = closed('old', '2026-06-01', 3, 3, [set('press', 50)])
    const recent = closed('new', '2026-09-01', 3, 3, [set('press', 70)])
    expect(progressFactor(recent, [old, recent])).toBe(1)
  })
})

describe('cohortFactor: edad y nivel', () => {
  it('juvenil 1,15; senior 1,20; adulto avanzado 0,85; el resto 1', () => {
    expect(cohortFactor(student({ birthDate: '2011-01-01' }), TODAY)).toBe(1.15)
    expect(cohortFactor(student({ birthDate: '1966-01-01' }), TODAY)).toBe(1.2)
    expect(cohortFactor(student({ birthDate: '1996-01-01', level: 'Avanzado' }), TODAY)).toBe(0.85)
    expect(cohortFactor(student({ birthDate: '1996-01-01' }), TODAY)).toBe(1)
    expect(cohortFactor(student(), TODAY)).toBe(1)
    expect(cohortFactor(undefined, TODAY)).toBe(1)
  })
})

describe('unlockBadges: cada insignia con el dia y la sesion que la gano', () => {
  it('la primera sesion da «primera sesion» y, con peso, «primer kilo»; la segunda no repite', () => {
    const first = closed('b1', '2026-09-01', 3, 3, [set('press', 40)])
    const second = closed('b2', '2026-09-02', 3, 3)
    const badges = unlockBadges('student-1', [first, second])
    expect(badges.map((badge) => [badge.code, badge.sessionId, badge.unlockedOn]).sort()).toEqual([
      ['first-session', 'b1', '2026-09-01'],
      ['first-weight', 'b1', '2026-09-01'],
    ])
  })

  it('siete dias seguidos desbloquean «semana perfecta» el septimo dia', () => {
    const week = [1, 2, 3, 4, 5, 6, 7].map((day) => closed(`d${day}`, `2026-08-0${day}`, 2, 2))
    const perfect = unlockBadges('student-1', week).find((badge) => badge.code === 'perfect-week')
    expect(perfect).toMatchObject({ sessionId: 'd7', unlockedOn: '2026-08-07' })
  })
})
