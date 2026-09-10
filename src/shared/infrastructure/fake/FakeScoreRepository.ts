import type {
  CrewMemberProgress,
  ProgressPeriod,
  ScoreRepository,
} from '@/shared/domain/ports/ScoreRepository'
import type { SessionScore } from '@/shared/domain/entities/progress'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import { monthBounds, weekBounds } from '@/shared/lib/dateKey'
import type { FakeSessionRepository } from './FakeSessionRepository'
import type { FakeStudentRepository } from './FakeStudentRepository'
import { scoreSession } from './scoring'

/**
 * La puntuacion simulada: se DERIVA de las sesiones en cada lectura.
 *
 * No hay tabla en memoria que mantener sincronizada: el disparador de la base
 * escribe `session_scores` al cerrar; aqui se aplica la misma regla sobre el
 * almacen de sesiones cuando alguien pregunta. Recibe las clases concretas y
 * no los puertos por lo mismo que `FakePlatformRepository`: necesita las
 * sesiones de TODO el equipo, que el ambito de un alumno no le daria.
 */
export class FakeScoreRepository implements ScoreRepository {
  private readonly sessions: FakeSessionRepository
  private readonly students: FakeStudentRepository
  private readonly scope: CrewScope

  constructor(sessions: FakeSessionRepository, students: FakeStudentRepository, scope: CrewScope) {
    this.sessions = sessions
    this.students = students
    this.scope = scope
  }

  private scoresOf(studentId: string): SessionScore[] {
    const student = this.students.listAll().find((candidate) => candidate.id === studentId)
    const history = this.sessions.listAll().filter((session) => session.studentId === studentId)
    return history
      .map((session) => scoreSession(session, history, student))
      .filter((score): score is SessionScore => score !== null)
      .sort((left, right) => right.completedOn.localeCompare(left.completedOn))
  }

  async ofStudent(studentId: string): Promise<SessionScore[]> {
    return this.scoresOf(studentId)
  }

  async ofSession(sessionId: string): Promise<SessionScore | null> {
    const session = this.sessions.listAll().find((candidate) => candidate.id === sessionId)
    if (session === undefined || session.studentId === null) return null
    return this.scoresOf(session.studentId).find((score) => score.sessionId === sessionId) ?? null
  }

  async ofCrew(period: ProgressPeriod): Promise<CrewMemberProgress[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const range = boundsFor(period)
    const entries = this.students.membersOf(crewId).map((student): CrewMemberProgress => {
      const counted = this.scoresOf(student.id).filter(
        (score) => range === null || (score.completedOn >= range.from && score.completedOn <= range.to)
      )
      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        photoUrl: student.photoUrl,
        experience: counted.reduce((total, score) => total + score.points, 0),
        completedSessions: counted.length,
      }
    })

    // De mas a menos, y con el nombre como desempate: sin el, dos personas con
    // los mismos puntos intercambian posiciones en cada recarga.
    return entries.sort((left, right) => {
      if (right.experience !== left.experience) return right.experience - left.experience
      return `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`)
    })
  }

  // Lo que mueve una puntuacion es una sesion: se escucha alli.
  onChange(listener: () => void): () => void {
    return this.sessions.onChange(listener)
  }
}

function boundsFor(period: ProgressPeriod): { from: string; to: string } | null {
  const today = new Date()
  if (period === 'week') return weekBounds(today)
  if (period === 'month') return monthBounds(today)
  return null
}
