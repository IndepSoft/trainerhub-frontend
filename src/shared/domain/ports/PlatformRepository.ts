import type { Crew, SubscriptionStatus } from '../entities/crew'

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
