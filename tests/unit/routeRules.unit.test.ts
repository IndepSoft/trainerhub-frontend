import { describe, expect, it } from 'vitest'
import { adherentWeeks, positionFrom, routeFromAssignments } from '@/shared/infrastructure/fake/routeRules'
import { routePathFrom } from '@/domains/progress/libs/routePath'
import type { Session } from '@/shared/domain/entities/session'
import type { Assignment } from '@/shared/domain/entities/assignment'
import type { TrainingPlan } from '@/shared/domain/entities/plan'

/**
 * El espejo simulado de las rutas: la ruta que sale del plan, las semanas de
 * adherencia y el nodo en el que se esta. Lo que hace la base lo afirma
 * `tests/contract/routes.contract.test.ts`.
 */

function session(id: string, date: string, status: Session['status']): Session {
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
    result:
      status === 'completed'
        ? { completedSets: 3, totalSets: 3, elapsedSeconds: 1800, completedAt: date }
        : null,
  }
}

// Miercoles 9 de septiembre de 2026; la semana empieza el lunes 7.
const ASOF = new Date(2026, 8, 9)

describe('adherentWeeks: semanas seguidas cumpliendo al menos el 85 %', () => {
  it('cuenta hacia atras desde la semana en curso y para en la primera que falla', () => {
    const sessions = [
      session('a', '2026-09-07', 'completed'),
      session('b', '2026-08-31', 'completed'),
      session('c', '2026-09-02', 'completed'),
      // La semana del 24: dos decididas, una cancelada -> 50 %, rompe.
      session('d', '2026-08-24', 'completed'),
      session('e', '2026-08-26', 'cancelled'),
      session('f', '2026-08-17', 'completed'),
    ]
    expect(adherentWeeks(sessions, ASOF)).toBe(2)
  })

  it('una semana sin nada programado no rompe ni alarga la cadena', () => {
    const sessions = [session('a', '2026-09-07', 'completed'), session('b', '2026-08-24', 'completed')]
    expect(adherentWeeks(sessions, ASOF)).toBe(2)
  })

  it('una pendiente que ya paso cuenta como no hecha; una futura no cuenta', () => {
    const missed = [session('a', '2026-09-07', 'completed'), session('b', '2026-09-08', 'pending')]
    expect(adherentWeeks(missed, ASOF)).toBe(0)
    const upcoming = [session('a', '2026-09-07', 'completed'), session('b', '2026-09-11', 'pending')]
    expect(adherentWeeks(upcoming, ASOF)).toBe(1)
  })
})

describe('positionFrom: se sube nodo a nodo mientras el siguiente cumpla las tres cosas', () => {
  it('sin validacion los numeros no abren nada', () => {
    expect(positionFrom(5000, 20, [])).toBe(1)
    expect(positionFrom(5000, 20, [2])).toBe(2)
    expect(positionFrom(5000, 20, [2, 3])).toBe(3)
    expect(positionFrom(5000, 20, [2, 3, 4])).toBe(4)
  })

  it('sin puntos o sin semanas, tampoco', () => {
    expect(positionFrom(299, 4, [2])).toBe(1)
    expect(positionFrom(300, 3, [2])).toBe(1)
    expect(positionFrom(300, 4, [2])).toBe(2)
    // Un nodo saltado no se puede validar por encima del hueco.
    expect(positionFrom(5000, 20, [3])).toBe(1)
  })
})

describe('routeFromAssignments: la ruta del ultimo plan asignado', () => {
  const plan = (id: string, objectiveId: string): TrainingPlan => ({
    id,
    crewId: 'crew-1',
    title: id,
    description: '',
    objectiveId,
    splitId: 'full-body',
    weeklyFrequency: 3,
    level: 'Principiante',
    weeks: [],
  })
  const plans = new Map<string, TrainingPlan>([
    ['p-fuerza', plan('p-fuerza', 'fuerza-maxima')],
    ['p-grasa', plan('p-grasa', 'perdida-grasa')],
  ])
  const assignment = (planId: string, assignedOn: string): Assignment => ({
    id: `${planId}-${assignedOn}`,
    crewId: 'crew-1',
    studentId: 'student-1',
    kind: 'plan',
    planId,
    startDate: null,
    assignedOn,
    notes: '',
  })

  it('manda el ultimo asignado; sin plan, Hybrid', () => {
    expect(routeFromAssignments([assignment('p-fuerza', '2026-08-01'), assignment('p-grasa', '2026-09-01')], plans)).toBe('vitality')
    expect(routeFromAssignments([assignment('p-fuerza', '2026-09-01'), assignment('p-grasa', '2026-08-01')], plans)).toBe('titan')
    expect(routeFromAssignments([], plans)).toBe('hybrid')
  })
})

describe('routePathFrom: un solo nodo activo, y los criterios acotados al objetivo', () => {
  it('el nodo en el que se esta y los anteriores van hechos; el siguiente, activo', () => {
    const path = routePathFrom({
      studentId: 's',
      routeCode: 'titan',
      position: 2,
      points: 700,
      adherentWeeks: 5,
      validatedPositions: [2],
    })
    expect(path.map((node) => node.state)).toEqual(['completed', 'completed', 'active', 'locked'])
    expect(path[2].points).toEqual({ current: 700, target: 1200 })
    expect(path[2].weeks).toEqual({ current: 5, target: 6 })
    expect(path[2].validated).toBe(false)
    expect(path[1].validated).toBe(true)
  })
})
