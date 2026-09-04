import type {
  CrewPostRepository,
  NewCrewPost,
} from '@/shared/domain/ports/CrewPostRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { CrewPost } from '@/shared/domain/entities/crewPost'
import { crewPostsSeed } from './crewPostsSeed'

/**
 * El muro simulado.
 *
 * Acotado al crew activo, como el resto: el filtrado lo hace esta clase, que es
 * lo que hará Postgres con RLS cuando exista. Ver `CrewScope`.
 *
 * TODO: los datos viven sólo en memoria. Al recargar vuelve la semilla.
 */
export class FakeCrewPostRepository implements CrewPostRepository {
  private posts: CrewPost[] = crewPostsSeed
  private readonly listeners = new Set<() => void>()
  // Campo declarado y asignado, no propiedad de parametro: `erasableSyntaxOnly`
  // esta activo en el `tsconfig`, y esa azucar de TypeScript emite codigo.
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<CrewPost[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    return this.posts
      .filter((post) => post.crewId === crewId)
      // Del más nuevo al más viejo. Se ordena sobre la copia que devuelve
      // `filter`, así que no se muta la colección.
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }

  async create(data: NewCrewPost): Promise<CrewPost> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new Error('No hay ningún crew activo: un anuncio pertenece a un equipo.')
    }

    const post: CrewPost = {
      id: crypto.randomUUID(),
      crewId,
      ...data,
      createdAt: new Date().toISOString(),
      // Nace sin «me gusta»: nadie ha reaccionado a algo que acaba de aparecer.
      likedBy: [],
    }

    this.posts = [post, ...this.posts]
    this.notify()
    return post
  }

  async toggleLike(postId: string, profileId: string): Promise<void> {
    this.posts = this.posts.map((post) => {
      if (post.id !== postId) return post

      const liked = post.likedBy.includes(profileId)
      return {
        ...post,
        likedBy: liked
          ? post.likedBy.filter((entry) => entry !== profileId)
          : [...post.likedBy, profileId],
      }
    })
    this.notify()
  }

  async remove(postId: string): Promise<void> {
    this.posts = this.posts.filter((post) => post.id !== postId)
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
