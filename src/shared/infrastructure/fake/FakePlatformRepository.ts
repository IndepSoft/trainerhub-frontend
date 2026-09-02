import type {
  CrewOverview,
  PlatformRepository,
  PlatformUser,
  SetMembershipInput,
  UserPage,
  UserPageQuery,
} from '@/shared/domain/ports/PlatformRepository'
import type { TrainerRepository } from '@/shared/domain/ports/TrainerRepository'
import type { Crew, SubscriptionStatus } from '@/shared/domain/entities/crew'
import { meaningfulExtras } from '@/shared/domain/permissions'
import { getShortName } from '@/shared/lib/personName'
import type { FakeCrewRepository } from './FakeCrewRepository'
import type { FakeCrewStaffRepository } from './FakeCrewStaffRepository'
import type { FakeStudentRepository } from './FakeStudentRepository'
import { platformAdminsSeed } from './platformAdminsSeed'

/**
 * Administración de la plataforma, simulada.
 *
 * RECIBE LAS CLASES CONCRETAS de crews y alumnos, no sus puertos, y es
 * deliberado: necesita leer POR ENCIMA del ámbito de un crew —todos los equipos,
 * los miembros de cada uno— y los puertos no ofrecen eso justamente porque
 * ofrecerlo a todo el mundo sería el agujero que la multi-tenencia evita. Los
 * métodos que usa de ellas no están en ningún puerto: son de la implementación
 * falsa, y con un backend real desaparecen —lo que hoy hace esto lo hará una
 * consulta con rol de servicio, que sí puede saltarse RLS—.
 *
 * Quien las junta es la raíz de composición, que es el único sitio que puede
 * nombrar implementaciones.
 *
 * TODO: los datos viven sólo en memoria. Al recargar vuelve la semilla.
 */
export class FakePlatformRepository implements PlatformRepository {
  private readonly crews: FakeCrewRepository
  private readonly students: FakeStudentRepository
  private readonly staff: FakeCrewStaffRepository
  private readonly trainers: TrainerRepository
  private readonly listeners = new Set<() => void>()

  constructor(
    crews: FakeCrewRepository,
    students: FakeStudentRepository,
    staff: FakeCrewStaffRepository,
    trainers: TrainerRepository
  ) {
    this.crews = crews
    this.students = students
    this.staff = staff
    this.trainers = trainers
  }

  async isAdmin(profileId: string): Promise<boolean> {
    return platformAdminsSeed.includes(profileId)
  }

  async listCrews(): Promise<CrewOverview[]> {
    const crews = this.crews.listAll()

    return Promise.all(
      crews.map(async (crew) => {
        const owner = await this.trainers.findByProfileId(crew.ownerId)

        return {
          crew,
          memberCount: this.students.countMembersOf(crew.id),
          // `null` y no «desconocido»: quién lo pinta decide cómo decirlo, y el
          // dato es que no hay ficha.
          ownerName: owner === null ? null : `${owner.firstName} ${owner.lastName}`,
        }
      })
    )
  }

  async listUsers(query: UserPageQuery): Promise<UserPage> {
    const crewNames = new Map(this.crews.listAll().map((crew: Crew) => [crew.id, crew.name]))
    const nameOf = (crewId: string) => crewNames.get(crewId) ?? 'Equipo borrado'

    /*
     * PLANTILLA Y ALUMNOS EN LA MISMA LISTA, y cada uno sale de donde vive: los
     * puestos de `crewStaff`, las fichas de `students`. No hay una tabla de
     * «usuarios» porque no hace falta una: lo que administra esta pantalla son
     * pertenencias, y alguien que esté en dos equipos aparece dos veces, con el
     * rol que tenga en cada uno.
     */
    const fromStaff: PlatformUser[] = this.staff.listAll().map((post) => ({
      membershipId: post.id,
      profileId: post.profileId,
      displayName: post.displayName,
      email: post.email,
      crewId: post.crewId,
      crewName: nameOf(post.crewId),
      role: post.role,
      extraCapabilities: post.extraCapabilities,
    }))

    const fromStudents: PlatformUser[] = this.students
      .listAll()
      .map((student) => ({
        membershipId: student.id,
        profileId: student.profileId,
        displayName: getShortName(student.firstName, student.lastName),
        email: student.email,
        crewId: student.crewId,
        crewName: nameOf(student.crewId),
        role: 'student' as const,
        extraCapabilities: student.extraCapabilities,
      }))

    const needle = query.search.trim().toLowerCase()
    const matching = [...fromStaff, ...fromStudents]
      .filter((user) => query.role === null || user.role === query.role)
      .filter(
        (user) =>
          needle === '' ||
          user.displayName.toLowerCase().includes(needle) ||
          user.email.toLowerCase().includes(needle)
      )
      // Por equipo y dentro de él por nombre: sin un orden estable, la página 2
      // puede repetir a alguien de la 1 y saltarse a otro.
      .sort((left, right) => {
        const byCrew = left.crewName.localeCompare(right.crewName)
        return byCrew !== 0 ? byCrew : left.displayName.localeCompare(right.displayName)
      })

    const from = (query.page - 1) * query.pageSize
    return { users: matching.slice(from, from + query.pageSize), total: matching.length }
  }

  async setMembership(input: SetMembershipInput): Promise<void> {
    const extras = meaningfulExtras(input.role, input.extraCapabilities)

    /*
     * La pertenencia puede ser un puesto o una ficha, y hay que averiguar cuál:
     * el identificador viene de una lista que junta las dos. Se prueba primero
     * la plantilla porque es la más pequeña.
     */
    const isStaff = this.staff.listAll().some((post) => post.id === input.membershipId)

    if (isStaff) {
      if (input.role === 'student') {
        /*
         * BAJAR A ALUMNO ES SALIR DE LA PLANTILLA, no quedarse en ella con el
         * rol cambiado: un puesto de `crewStaff` significa «trabaja aquí». Su
         * ficha de alumno, si la necesita, se crea desde el equipo.
         */
        await this.staff.remove(input.membershipId)
      } else {
        await this.staff.updateRole(input.membershipId, input.role)
        await this.staff.updateCapabilities(input.membershipId, extras)
      }
    } else {
      if (input.role !== 'student') {
        /*
         * TODO: ascender a un alumno a plantilla necesita crear su puesto en el
         * crew de su ficha, y `crewStaff.add` escribe en el crew ACTIVO —que
         * para el administrador de plataforma es el suyo, no el del alumno—.
         * Mientras el alta de puestos no acepte un crew explícito, esto se queda
         * fuera y la pantalla no ofrece la opción.
         */
        throw new Error('Ascender a un alumno a la plantilla todavía no está implementado.')
      }
      await this.students.updateCapabilities(input.membershipId, extras)
    }

    this.notify()
  }

  async setSubscription(crewId: string, status: SubscriptionStatus): Promise<void> {
    this.crews.setSubscription(crewId, status)
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
