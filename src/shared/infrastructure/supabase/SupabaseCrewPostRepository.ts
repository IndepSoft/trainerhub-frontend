import type { CrewPostRepository, NewCrewPost } from '@/shared/domain/ports/CrewPostRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { CrewPost } from '@/shared/domain/entities/crewPost'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toCrewPost, type CrewPostRow } from './mappers'

/**
 * Implementacion de CrewPostRepository sobre PostgREST.
 *
 * SE LEE DE LA VISTA, NO DE LA TABLA: `crew_posts_view` trae el contador de
 * «me gusta» y si el que mira ya lo dio, calculados para quien pregunta. La
 * lista entera de quien lo dio no viaja nunca, que era el TODO de `CrewPost`.
 *
 * `toggleLike` es una funcion del servidor: quien mira no tiene por que saber
 * si ya lo habia dado, y dos escrituras desde aqui -leer, decidir, escribir-
 * dejarian sitio a que dos toques rapidos contaran doble.
 */
export class SupabaseCrewPostRepository implements CrewPostRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<CrewPost[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase
      .from('crew_posts_view')
      .select('*')
      .eq('crew_id', crewId)
      .order('created_at', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as CrewPostRow[]).map(toCrewPost)
  }

  async create(data: NewCrewPost): Promise<CrewPost> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new AppError(AppErrorCode.VALIDATION, 'noActiveCrew')
    }

    const { data: inserted, error } = await supabase
      .from('crew_posts')
      .insert({ crew_id: crewId, author_profile_id: data.authorProfileId, body: data.body })
      .select('id')
      .single()

    if (error) throw mapDataError(error)

    // La fila de la tabla no trae los dos campos calculados: se vuelve a leer
    // por la vista, que es la unica forma que la aplicacion conoce.
    const { data: row, error: readError } = await supabase
      .from('crew_posts_view')
      .select('*')
      .eq('id', inserted.id)
      .single()

    if (readError) throw mapDataError(readError)
    this.notify()
    return toCrewPost(row as CrewPostRow)
  }

  async toggleLike(postId: string): Promise<void> {
    const { error } = await supabase.rpc('toggle_post_like', { post: postId })

    if (error) throw mapDataError(error)
    this.notify()
  }

  async remove(postId: string): Promise<void> {
    const { error } = await supabase.from('crew_posts').delete().eq('id', postId)

    if (error) throw mapDataError(error)
    this.notify()
  }

  async countUnread(): Promise<number> {
    const crewId = this.scope.current()
    if (crewId === null) return 0

    // Sin marca, todo esta sin leer: es el caso de quien acaba de entrar.
    const { data: mark, error: markError } = await supabase
      .from('crew_wall_reads')
      .select('read_at')
      .eq('crew_id', crewId)
      .maybeSingle()
    if (markError) throw mapDataError(markError)

    let query = supabase
      .from('crew_posts')
      .select('id', { count: 'exact', head: true })
      .eq('crew_id', crewId)
    if (mark !== null) query = query.gt('created_at', (mark as { read_at: string }).read_at)

    const { count, error } = await query
    if (error) throw mapDataError(error)
    return count ?? 0
  }

  async markAllRead(): Promise<void> {
    const crewId = this.scope.current()
    if (crewId === null) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user === null) return

    const { error } = await supabase
      .from('crew_wall_reads')
      .upsert({ profile_id: user.id, crew_id: crewId, read_at: new Date().toISOString() })
    if (error) throw mapDataError(error)
    this.notify()
  }

  /*
   * Los oyentes se avisan de lo que ESTE cliente escribe: publicar, dar «me
   * gusta», borrar o marcar como leido se ven al instante sin recargar. Lo que
   * escriben otros llega por tiempo real, que se suscribe aparte.
   */
  private readonly listeners = new Set<() => void>()

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
