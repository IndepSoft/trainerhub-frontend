import type { MilestoneValidationInput, RouteRepository } from '@/shared/domain/ports/RouteRepository'
import type { ProgressRouteCode, RouteProgress } from '@/shared/domain/entities/progress'
import type { TrainingPlan } from '@/shared/domain/entities/plan'
import type { FakeAssignmentRepository } from './FakeAssignmentRepository'
import type { FakeBadgeRepository } from './FakeBadgeRepository'
import type { FakePlanRepository } from './FakePlanRepository'
import type { FakeScoreRepository } from './FakeScoreRepository'
import type { FakeSessionRepository } from './FakeSessionRepository'
import { adherentWeeks, positionFrom, routeFromAssignments } from './routeRules'

interface ChosenRoute {
  route: ProgressRouteCode
  since: string
}

/**
 * Las rutas simuladas. La eleccion a mano y las validaciones viven en memoria;
 * el resto se deriva en cada lectura, como hace `route_progress`.
 *
 * Recibe las clases concretas por lo de siempre: necesita cruzar sesiones,
 * asignaciones, planes y puntuaciones de un alumno, que en la base hace una
 * funcion con los privilegios de su dueño.
 */
export class FakeRouteRepository implements RouteRepository {
  private readonly sessions: FakeSessionRepository
  private readonly assignments: FakeAssignmentRepository
  private readonly plans: FakePlanRepository
  private readonly scores: FakeScoreRepository
  private readonly badges: FakeBadgeRepository
  private readonly chosen = new Map<string, ChosenRoute>()
  private readonly validations = new Map<string, number[]>()
  private readonly listeners = new Set<() => void>()

  constructor(
    sessions: FakeSessionRepository,
    assignments: FakeAssignmentRepository,
    plans: FakePlanRepository,
    scores: FakeScoreRepository,
    badges: FakeBadgeRepository
  ) {
    this.sessions = sessions
    this.assignments = assignments
    this.plans = plans
    this.scores = scores
    this.badges = badges
  }

  private routeOf(studentId: string): ChosenRoute {
    const chosen = this.chosen.get(studentId)
    if (chosen !== undefined) return chosen
    const plansById = new Map<string, TrainingPlan>(this.plans.listAll().map((plan) => [plan.id, plan]))
    const own = this.assignments.listAll().filter((assignment) => assignment.studentId === studentId)
    return { route: routeFromAssignments(own, plansById), since: '1900-01-01' }
  }

  async progressOf(studentId: string): Promise<RouteProgress> {
    const { route, since } = this.routeOf(studentId)
    const points = (await this.scores.ofStudent(studentId))
      .filter((score) => score.completedOn >= since)
      .reduce((total, score) => total + score.points, 0)
    const weeks = adherentWeeks(this.sessions.listAll().filter((session) => session.studentId === studentId))
    const validated = this.validations.get(`${studentId}:${route}`) ?? []

    return {
      studentId,
      routeCode: route,
      position: positionFrom(points, weeks, validated),
      points,
      adherentWeeks: weeks,
      validatedPositions: validated,
    }
  }

  async choose(studentId: string, route: ProgressRouteCode): Promise<void> {
    this.chosen.set(studentId, { route, since: new Date().toISOString().slice(0, 10) })
    this.notify()
  }

  async validateMilestone(input: MilestoneValidationInput): Promise<void> {
    const key = `${input.studentId}:${input.route}`
    const current = this.validations.get(key) ?? []
    if (!current.includes(input.position)) {
      this.validations.set(key, [...current, input.position].sort())
    }

    // El sello del entrenador: cinco hitos validados, en cualquier ruta.
    let total = 0
    for (const [candidate, positions] of this.validations) {
      if (candidate.startsWith(`${input.studentId}:`)) total += positions.length
    }
    if (total >= 5) this.badges.grant(input.studentId, 'coach-seal')

    this.notify()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    const unsubscribeSessions = this.sessions.onChange(listener)
    return () => {
      this.listeners.delete(listener)
      unsubscribeSessions()
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
