import type { BlockLibraryRepository } from '@/shared/domain/ports/BlockLibraryRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { Block } from '@/shared/domain/entities/routine'
import type { SavedBlock } from '@/shared/domain/entities/savedBlock'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toSavedBlock, type SavedBlockRow } from './mappers'
import { subscribeToTable } from './realtime'

/**
 * Implementacion de BlockLibraryRepository sobre PostgREST.
 *
 * El bloque se guarda como documento JSONB, validado por `is_valid_block`, con
 * la misma forma que `Block`: se copia entero al insertarlo en una rutina, y
 * nunca se consulta por dentro.
 */
export class SupabaseBlockLibraryRepository implements BlockLibraryRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<SavedBlock[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase
      .from('saved_blocks')
      .select('*')
      .eq('crew_id', crewId)
      .order('created_at', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as SavedBlockRow[]).map(toSavedBlock)
  }

  async save(name: string, block: Block): Promise<SavedBlock> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new AppError(AppErrorCode.VALIDATION, 'noActiveCrew')
    }

    const { data, error } = await supabase
      .from('saved_blocks')
      .insert({ crew_id: crewId, name, block })
      .select('*')
      .single()

    if (error) throw mapDataError(error)
    return toSavedBlock(data as SavedBlockRow)
  }

  async rename(savedBlockId: string, name: string): Promise<void> {
    const { error } = await supabase.from('saved_blocks').update({ name }).eq('id', savedBlockId)

    if (error) throw mapDataError(error)
  }

  async remove(savedBlockId: string): Promise<void> {
    const { error } = await supabase.from('saved_blocks').delete().eq('id', savedBlockId)

    if (error) throw mapDataError(error)
  }

  /**
   * La biblioteca es del equipo tecnico entero, no de quien guardo el bloque:
   * dos entrenadores construyendo rutinas a la vez comparten lo que guardan.
   */
  onChange(listener: () => void): () => void {
    return subscribeToTable('saved_blocks', listener)
  }
}
