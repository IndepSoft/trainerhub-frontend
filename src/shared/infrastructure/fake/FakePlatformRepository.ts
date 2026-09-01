import type {
  CrewOverview,
  PlatformRepository,
} from '@/shared/domain/ports/PlatformRepository'
import type { TrainerRepository } from '@/shared/domain/ports/TrainerRepository'
import type { SubscriptionStatus } from '@/shared/domain/entities/crew'
import type { FakeCrewRepository } from './FakeCrewRepository'
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
  private readonly trainers: TrainerRepository
  private readonly listeners = new Set<() => void>()

  constructor(
    crews: FakeCrewRepository,
    students: FakeStudentRepository,
    trainers: TrainerRepository
  ) {
    this.crews = crews
    this.students = students
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
