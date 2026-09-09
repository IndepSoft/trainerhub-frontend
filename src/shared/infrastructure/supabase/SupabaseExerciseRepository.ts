import type { ExerciseRepository } from '@/shared/domain/ports/ExerciseRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { Exercise } from '@/shared/domain/entities/exercise'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toExercise, toExerciseRow, type ExerciseRow } from './mappers'

/**
 * Implementacion de ExerciseRepository sobre PostgREST.
 *
 * LOS DE SISTEMA Y LOS DEL EQUIPO, EN UNA LISTA. `crew_id` nulo es «de
 * sistema» y lo ve todo el mundo; con `crew_id`, es del equipo. Es lo que el
 * catalogo simulado ya anunciaba: ampliable por el entrenador, no editable en su
 * base. RLS es quien decide que filas llegan; aqui solo se piden.
 *
 * Crear, editar y borrar solo alcanzan a los del equipo: los de sistema los
 * escribe el rol de servicio, y un `update` sobre uno de ellos no encuentra
 * fila.
 */
export class SupabaseExerciseRepository implements ExerciseRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<Exercise[]> {
    const crewId = this.scope.current()

    let query = supabase.from('exercises').select('*').order('name')
    // Sin crew activo solo se ven los de sistema; con el, los suyos ademas.
    query = crewId === null ? query.is('crew_id', null) : query.or(`crew_id.is.null,crew_id.eq.${crewId}`)

    const { data, error } = await query

    if (error) throw mapDataError(error)
    return ((data ?? []) as ExerciseRow[]).map(toExercise)
  }

  async create(data: Omit<Exercise, 'id'>): Promise<Exercise> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new AppError(AppErrorCode.VALIDATION, 'noActiveCrew')
    }

    const { data: row, error } = await supabase
      .from('exercises')
      .insert({ crew_id: crewId, ...toExerciseRow(data) })
      .select('*')
      .single()

    if (error) throw mapDataError(error)
    return toExercise(row as ExerciseRow)
  }

  async update(exerciseId: string, data: Omit<Exercise, 'id'>): Promise<void> {
    const { error } = await supabase.from('exercises').update(toExerciseRow(data)).eq('id', exerciseId)

    if (error) throw mapDataError(error)
  }

  async remove(exerciseId: string): Promise<void> {
    const { error } = await supabase.from('exercises').delete().eq('id', exerciseId)

    if (error) throw mapDataError(error)
  }

  /** TODO: sin suscripcion todavia. Ver el plan, §1.3. */
  onChange(): () => void {
    return () => undefined
  }
}
