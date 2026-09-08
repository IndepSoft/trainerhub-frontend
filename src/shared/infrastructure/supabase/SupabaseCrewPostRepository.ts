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
    return toCrewPost(row as CrewPostRow)
  }

  async toggleLike(postId: string): Promise<void> {
    const { error } = await supabase.rpc('toggle_post_like', { post: postId })

    if (error) throw mapDataError(error)
  }

  async remove(postId: string): Promise<void> {
    const { error } = await supabase.from('crew_posts').delete().eq('id', postId)

    if (error) throw mapDataError(error)
  }

  /** El muro es el segundo en la lista de tiempo real del plan, §1.3. Hasta entonces, no avisar vale. */
  onChange(): () => void {
    return () => undefined
  }
}
