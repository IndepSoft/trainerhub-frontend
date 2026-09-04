import type {
  CrewMemberProgress,
  ProgressPeriod,
  CrewProgressRepository,
} from '@/shared/domain/ports/CrewProgressRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import { completedBetween, completedSessions, totalExperience } from '@/shared/domain/experience'
import { monthBounds, weekBounds } from '@/shared/lib/dateKey'
import type { FakeSessionRepository } from './FakeSessionRepository'
import type { FakeStudentRepository } from './FakeStudentRepository'

/**
 * El ranking simulado.
 *
 * RECIBE LAS CLASES CONCRETAS de sesiones y alumnos, no sus puertos, por el
 * mismo motivo que `FakePlatformRepository`: necesita las sesiones de TODO el
 * equipo, y el ámbito de un alumno le deja ver sólo las suyas —a propósito, para
 * que nadie sepa con quién entrena el entrenador y cuándo—.
 *
 * Ahí está la razón de que el ranking sea un puerto y no un cálculo en el
 * cliente: calcularlo ahí exigiría abrirle esas sesiones a quien mira, es decir,
 * romper el aislamiento para pintar una tabla. Aquí sale ya resuelto, y de las
 * sesiones de nadie cruza nada.
 *
 * Los métodos que usa de ellas no están en ningún puerto. Con backend esto es
 * una consulta agregada.
 */
export class FakeCrewProgressRepository implements CrewProgressRepository {
  private readonly sessions: FakeSessionRepository
  private readonly students: FakeStudentRepository
  private readonly scope: CrewScope
  private readonly listeners = new Set<() => void>()

  constructor(
    sessions: FakeSessionRepository,
    students: FakeStudentRepository,
    scope: CrewScope
  ) {
    this.sessions = sessions
    this.students = students
    this.scope = scope
  }

  async ofCrew(period: ProgressPeriod): Promise<CrewMemberProgress[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const range = boundsFor(period)
    const members = this.students.membersOf(crewId)
    const crewSessions = this.sessions.allOfCrew(crewId)

    const entries = members.map((student): CrewMemberProgress => {
      const own = crewSessions.filter((session) => session.studentId === student.id)
      const counted = range === null ? completedSessions(own) : completedBetween(own, range.from, range.to)

      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        photoUrl: student.photoUrl,
        experience: totalExperience(counted),
        completedSessions: counted.length,
      }
    })

    /*
     * De más a menos, y con el nombre como desempate.
     *
     * El desempate NO es decorativo: sin él, dos personas con la misma
     * experiencia intercambian posiciones en cada recarga —el orden lo decidiría
     * el de la lista de miembros— y el ranking parece moverse solo. Por nombre
     * es arbitrario pero estable, que es lo que hace falta.
     */
    return entries.sort((left, right) => {
      if (right.experience !== left.experience) return right.experience - left.experience
      return `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`)
    })
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}

/**
 * El tramo de cada periodo, o `null` para el histórico.
 *
 * `null` y no un rango enorme desde el año cero: un rango imposible sigue siendo
 * un filtro que recorrer, y decir «sin límites» es más honesto que inventar uno
 * que nunca se alcanza.
 */
function boundsFor(period: ProgressPeriod): { from: string; to: string } | null {
  const today = new Date()

  if (period === 'week') return weekBounds(today)
  if (period === 'month') return monthBounds(today)
  return null
}
