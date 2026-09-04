import type {
  CrewRepository,
  CrewSettings,
  NewCrew,
} from '@/shared/domain/ports/CrewRepository'
import type { Crew, SubscriptionStatus } from '@/shared/domain/entities/crew'
import { crewsSeed } from './crewsSeed'

/**
 * Alfabeto del token de invitación.
 *
 * Sin `0`/`O` ni `1`/`I`/`L`: el token también se puede teclear a mano cuando el
 * QR falla —cámara denegada, mala luz, pantalla rota—, y esos pares son la
 * primera fuente de errores al copiar un código de una pantalla ajena.
 */
const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

const TOKEN_LENGTH = 8

/**
 * Crews simulados mientras no hay backend.
 *
 * TODO: los datos viven sólo en memoria. Al recargar vuelve la semilla.
 *
 * En producción el token NO se genera en el cliente: lo emite el servidor, que
 * es quien puede garantizar que no se repite y quien tiene una fuente de
 * aleatoriedad de la que fiarse. Aquí se genera con `crypto.getRandomValues`,
 * que es lo correcto en el navegador y sigue siendo un sustituto.
 */
export class FakeCrewRepository implements CrewRepository {
  private crews: Crew[] = crewsSeed
  private readonly listeners = new Set<() => void>()

  async findById(crewId: string): Promise<Crew | null> {
    return this.crews.find((crew) => crew.id === crewId) ?? null
  }

  async findByJoinToken(joinToken: string): Promise<Crew | null> {
    // Normalizado: quien teclea el código a mano lo escribe en minúsculas o con
    // el guión de separación que la interfaz pinta para hacerlo legible.
    const normalized = joinToken.replace(/-/g, '').trim().toUpperCase()
    return this.crews.find((crew) => crew.joinToken === normalized) ?? null
  }

  async create(data: NewCrew): Promise<Crew> {
    const crew: Crew = {
      id: crypto.randomUUID(),
      ...data,
      joinToken: this.buildUniqueToken(),
      // Con aprobación por defecto: un QR es un secreto que se enseña en
      // público, y quien lo vea en la pared no debería entrar sin que nadie lo
      // sepa. Se puede desactivar para un crew abierto.
      requiresApproval: true,
      rankingEnabled: true,
      /*
       * NACE PENDIENTE. Crear el equipo, el catalogo y las rutinas es gratis
       * -es trabajo del entrenador y no lo ve nadie mas-; lo que exige
       * activacion es meter alumnos. Ver `canEnrollMembers`.
       */
      subscriptionStatus: 'pending',
    }

    this.crews = [...this.crews, crew]
    this.notify()
    return crew
  }

  async update(crewId: string, data: CrewSettings): Promise<void> {
    this.crews = this.crews.map((crew) => (crew.id === crewId ? { ...crew, ...data } : crew))
    this.notify()
  }

  async rotateJoinToken(crewId: string): Promise<string> {
    const joinToken = this.buildUniqueToken()
    this.crews = this.crews.map((crew) => (crew.id === crewId ? { ...crew, joinToken } : crew))
    this.notify()
    return joinToken
  }

  /**
   * Todos los crews, sin acotar.
   *
   * NO ESTA EN EL PUERTO, y es lo que la mantiene honesta: `CrewRepository`
   * promete operaciones de un equipo, y esto ve todos. Solo la usa
   * `FakePlatformRepository`, a quien la raiz de composicion se la entrega
   * expresamente. Con backend desaparece: sera una consulta con rol de
   * servicio, que es lo unico que puede saltarse RLS.
   */
  listAll(): Crew[] {
    return this.crews
  }

  /** Igual que `listAll`: fuera del puerto, y solo para la plataforma. */
  setSubscription(crewId: string, subscriptionStatus: SubscriptionStatus): void {
    this.crews = this.crews.map((crew) =>
      crew.id === crewId ? { ...crew, subscriptionStatus } : crew
    )
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

  /**
   * Un token que no esté ya en uso.
   *
   * La comprobación existe porque el token es la clave por la que se busca: dos
   * crews con el mismo token harían que escanear uno te metiera en el otro. Con
   * 31^8 combinaciones la colisión es remotísima, y aun así comprobarla cuesta
   * una línea; lo que no cuesta una línea es diagnosticarla.
   */
  private buildUniqueToken(): string {
    let token = buildToken()
    while (this.crews.some((crew) => crew.joinToken === token)) {
      token = buildToken()
    }
    return token
  }
}

function buildToken(): string {
  const values = crypto.getRandomValues(new Uint32Array(TOKEN_LENGTH))
  return [...values].map((value) => TOKEN_ALPHABET[value % TOKEN_ALPHABET.length]).join('')
}
