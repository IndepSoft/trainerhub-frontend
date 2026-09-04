import type { Crew, CrewRole, SubscriptionStatus } from '../entities/crew'
import type { Capability } from '../permissions'

/**
 * Puerto de administración de la plataforma.
 *
 * ES EL ÚNICO PUERTO QUE MIRA POR ENCIMA DE LOS CREWS, y por eso está separado
 * de `CrewRepository` en vez de ser dos métodos más suyos. Todo lo demás en esta
 * aplicación está acotado a un equipo; esto no puede estarlo, porque su trabajo
 * es justamente ver todos. Tenerlo aparte hace que esa excepción se vea al leer
 * la lista de puertos, en lugar de esconderse dentro de uno que promete lo
 * contrario.
 *
 * TODO: con backend, cada método de aquí exige rol de plataforma EN EL SERVIDOR.
 * Un cliente modificado puede llamar a `setSubscription` igual que puede llamar
 * a cualquier otra cosa: lo que impide que funcione no es que la pantalla esté
 * escondida, es la política del servidor.
 */
export interface PlatformRepository {
  /**
   * Si este perfil administra la plataforma.
   *
   * Se pregunta al repositorio y NO se lee de la cuenta, por lo mismo que el
   * rol de crew: `user_metadata` lo puede editar el propio usuario con una
   * llamada, así que un administrador guardado ahí es un administrador que
   * cualquiera se puede nombrar.
   */
  isAdmin(profileId: string): Promise<boolean>

  /** Todos los crews de la plataforma, para el panel de control. */
  listCrews(): Promise<CrewOverview[]>

  /**
   * Las cuentas de la plataforma, por páginas.
   *
   * IDENTIDAD Y ACCESO, NUNCA CONTENIDO. Aquí salen nombre, correo, equipo y
   * rol: lo que hace falta para administrar cuentas. No sale nada de lo que esa
   * persona entrena —sus sesiones, su progreso, su edad, su grasa corporal—,
   * porque administrar la plataforma no es leer los datos de los alumnos de un
   * cliente. Esa línea es lo que hace que el resto de los equipos sea privado.
   *
   * PAGINADA porque una lista completa deja de caber en cuanto la plataforma
   * crezca, y porque un `findAll` que devuelve todo es la clase de método que
   * nadie sustituye hasta que ya duele.
   */
  listUsers(query: UserPageQuery): Promise<UserPage>

  /**
   * Cambia el rol de alguien en su equipo, y sus concesiones.
   *
   * Una sola operación porque son una sola decisión de quien la toma: «esta
   * persona pasa a ser entrenador, y además le dejo los ajustes». Partirla en
   * dos dejaría un instante con el rol nuevo y los permisos viejos.
   */
  setMembership(input: SetMembershipInput): Promise<void>

  /**
   * Activa, suspende o deja pendiente la suscripción de un crew.
   *
   * Operación propia y fuera de `CrewRepository.update`: si viajara con los
   * ajustes del equipo, el dueño podría activarse la suscripción a sí mismo
   * desde su propia pantalla de ajustes. Quién puede llamarla es tan parte de
   * la operación como lo que hace.
   */
  setSubscription(crewId: string, status: SubscriptionStatus): Promise<void>

  /** Avisa de que algo ha cambiado. Devuelve la función de baja. */
  onChange(listener: () => void): () => void
}

/**
 * Un crew visto desde la plataforma, con lo que hace falta para decidir.
 *
 * Lleva el recuento de miembros porque es lo que distingue un equipo real de uno
 * creado y abandonado, y es la primera pregunta al mirar una lista de altas
 * pendientes. Se calcula al servir y no se guarda: un contador almacenado se
 * desincroniza en cuanto alguien entra o sale.
 */
export interface CrewOverview {
  crew: Crew
  memberCount: number
  /** El nombre de quien lo creó, o `null` si su ficha ya no existe. */
  ownerName: string | null
}

/** Qué página se pide, y filtrada por qué. */
export interface UserPageQuery {
  /** Empezando en 1, que es como se enseña. */
  page: number
  pageSize: number
  /**
   * Busca por nombre o correo. Vacío es «sin filtrar».
   *
   * Se busca en el servidor y no en el cliente a propósito: filtrar la página
   * que ya se tiene daría resultados dentro de veinte y ninguno en el resto, que
   * es la clase de fallo que nadie reproduce.
   */
  search: string
  /** `null` para todos los roles. */
  role: CrewRole | null
}

export interface UserPage {
  users: PlatformUser[]
  /** Cuántos hay en total con este filtro, para pintar «página 2 de 7». */
  total: number
}

/**
 * Una cuenta vista desde la plataforma.
 *
 * `membershipId` identifica la PERTENENCIA, no a la persona: alguien puede estar
 * en dos equipos con roles distintos, y aparece una vez por cada uno. Cambiar su
 * rol es cambiar el de esa pertenencia, no el de la persona, que no tiene uno.
 */
export interface PlatformUser {
  membershipId: string
  profileId: string | null
  displayName: string
  email: string
  crewId: string
  crewName: string
  role: CrewRole
  extraCapabilities: Capability[]
}

export interface SetMembershipInput {
  membershipId: string
  role: CrewRole
  extraCapabilities: Capability[]
}
