import type { Crew, CrewDenomination } from '../entities/crew'

/**
 * Puerto de acceso a crews.
 *
 * Métodos con intención de negocio: «los crews que entreno», «el crew de este
 * token», «rota el token». Nada de constructores de consulta, por lo de siempre:
 * si el puerto habla el lenguaje del proveedor, el desacoplamiento es ficticio.
 *
 * `rotateJoinToken` es un método y no un `update` con un token nuevo puesto
 * desde fuera. Quien llama no debe saber cómo se genera un secreto ni tener la
 * oportunidad de elegirlo: pedirlo es la operación, el valor lo pone quien sabe.
 */
export interface CrewRepository {
  findById(crewId: string): Promise<Crew | null>

  /**
   * El crew al que pertenece un token de invitación, o `null`.
   *
   * `null` cubre los dos casos que importan y no hay que distinguirlos de cara
   * al usuario: el token no existe nunca, o existió y se rotó. Decir cuál de los
   * dos es sería confirmarle a quien prueba tokens que acertó alguna vez.
   */
  findByJoinToken(joinToken: string): Promise<Crew | null>

  create(data: NewCrew): Promise<Crew>
  update(crewId: string, data: CrewSettings): Promise<void>

  /** Genera un token nuevo e invalida el anterior. Devuelve el nuevo. */
  rotateJoinToken(crewId: string): Promise<string>

  /** Avisa de que la colección ha cambiado. Devuelve la función de baja. */
  onChange(listener: () => void): () => void
}

/**
 * Lo que hace falta para crear un crew.
 *
 * `joinToken` no está: lo genera el repositorio, igual que en la rotación.
 * `ownerId` sí, porque quien crea el crew es una decisión de quien llama —el
 * perfil que ha iniciado sesión—, no del almacén.
 */
export interface NewCrew {
  name: string
  denomination: CrewDenomination
  ownerId: string
}

/** Los ajustes que el dueño puede cambiar después. */
export interface CrewSettings {
  name: string
  denomination: CrewDenomination
  requiresApproval: boolean
  rankingEnabled: boolean
}
