import type { NewRoutine, RoutineRepository } from '@/shared/domain/ports/RoutineRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { Routine } from '@/shared/domain/entities/routine'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toRoutine, toRoutineRow, type RoutineRow } from './mappers'
import { subscribeToTable } from './realtime'

/**
 * Implementacion de RoutineRepository sobre PostgREST.
 *
 * LOS BLOQUES VIAJAN COMO DOCUMENTO. `blocks` es una columna JSONB con la misma
 * forma que `Routine.blocks`, validada en la base por `is_valid_blocks`: una
 * rutina se edita y se lee entera, y nunca se consulta por dentro. Plan, §1.2.
 */
export class SupabaseRoutineRepository implements RoutineRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<Routine[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('crew_id', crewId)
      .order('created_at', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as RoutineRow[]).map(toRoutine)
  }

  async findById(routineId: string): Promise<Routine | null> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('id', routineId)
      .maybeSingle()

    if (error) throw mapDataError(error)
    return data === null ? null : toRoutine(data as RoutineRow)
  }

  async create(data: NewRoutine): Promise<Routine> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new AppError(AppErrorCode.VALIDATION, 'noActiveCrew')
    }

    const { data: row, error } = await supabase
      .from('routines')
      .insert({ crew_id: crewId, ...toRoutineRow(data) })
      .select('*')
      .single()

    if (error) throw mapDataError(error)
    return toRoutine(row as RoutineRow)
  }

  async update(routineId: string, data: NewRoutine): Promise<void> {
    const { error } = await supabase.from('routines').update(toRoutineRow(data)).eq('id', routineId)

    if (error) throw mapDataError(error)
  }

  async remove(routineId: string): Promise<void> {
    // Una rutina que algun plan o asignacion referencia no se borra: lo dice la
    // clave foranea con `on delete restrict`, y `mapDataError` lo traduce.
    const { error } = await supabase.from('routines').delete().eq('id', routineId)

    if (error) throw mapDataError(error)
  }

  /**
   * Una rutina publicada aparece en la agenda y en las asignaciones de quien la
   * va a hacer, que no es quien la escribio.
   */
  onChange(listener: () => void): () => void {
    return subscribeToTable('routines', listener)
  }
}
