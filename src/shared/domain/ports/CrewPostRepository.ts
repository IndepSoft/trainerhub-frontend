import type { CrewPost } from '../entities/crewPost'

/**
 * Puerto del muro del equipo.
 *
 * Acotado al crew activo, como todo lo demás: el ámbito no aparece en ninguna
 * firma. Ver `CrewScope`.
 */
export interface CrewPostRepository {
  /** Los anuncios del crew activo, del más nuevo al más viejo. */
  findAll(): Promise<CrewPost[]>

  /**
   * Publica un anuncio.
   *
   * `authorProfileId` viaja en los datos porque es una decisión de quien llama
   * —el perfil que ha iniciado sesión—, no del almacén.
   */
  create(data: NewCrewPost): Promise<CrewPost>

  /**
   * Pone o quita el «me gusta» de una persona.
   *
   * UNA SOLA OPERACIÓN Y NO `like`/`unlike`, porque el botón es uno y alterna:
   * con dos métodos, quien pulsa tendría que saber antes en qué estado está, y
   * entre saberlo y llamar cabe otro toque. Así pulsar dos veces deja las cosas
   * como estaban en vez de duplicar el «me gusta».
   */
  toggleLike(postId: string, profileId: string): Promise<void>

  remove(postId: string): Promise<void>

  /** Avisa de que la colección ha cambiado. Devuelve la función de baja. */
  onChange(listener: () => void): () => void
}

/**
 * Un anuncio nuevo.
 *
 * Sin `crewId` —lo pone el adaptador desde el ámbito activo— y sin `likedBy`,
 * que nace vacío: nadie ha dado «me gusta» a algo que se acaba de publicar, y
 * dejar que quien llama lo rellene permitiría estrenar un anuncio con cien.
 */
export type NewCrewPost = Pick<CrewPost, 'authorProfileId' | 'body'>
