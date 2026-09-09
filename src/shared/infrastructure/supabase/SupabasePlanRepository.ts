import type { NewPlan, PlanRepository } from '@/shared/domain/ports/PlanRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { TrainingPlan } from '@/shared/domain/entities/plan'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toPlan, toPlanRow, type PlanRow } from './mappers'
import { subscribeToTable } from './realtime'

/**
 * Implementacion de PlanRepository sobre PostgREST.
 *
 * Las semanas viajan como documento JSONB validado por `is_valid_weeks`, por el
 * mismo motivo que los bloques de una rutina. Plan, §1.2.
 */
export class SupabasePlanRepository implements PlanRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<TrainingPlan[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('crew_id', crewId)
      .order('created_at', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as PlanRow[]).map(toPlan)
  }

  async findById(planId: string): Promise<TrainingPlan | null> {
    const { data, error } = await supabase.from('plans').select('*').eq('id', planId).maybeSingle()

    if (error) throw mapDataError(error)
    return data === null ? null : toPlan(data as PlanRow)
  }

  async create(data: NewPlan): Promise<TrainingPlan> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new AppError(AppErrorCode.VALIDATION, 'noActiveCrew')
    }

    const { data: row, error } = await supabase
      .from('plans')
      .insert({ crew_id: crewId, ...toPlanRow(data) })
      .select('*')
      .single()

    if (error) throw mapDataError(error)
    return toPlan(row as PlanRow)
  }

  async update(planId: string, data: NewPlan): Promise<void> {
    const { error } = await supabase.from('plans').update(toPlanRow(data)).eq('id', planId)

    if (error) throw mapDataError(error)
  }

  async remove(planId: string): Promise<void> {
    const { error } = await supabase.from('plans').delete().eq('id', planId)

    if (error) throw mapDataError(error)
  }

  /**
   * Un plan lo escribe el entrenador y lo esperan sus alumnos: que «lo edita
   * una persona» describe al autor, no al publico.
   */
  onChange(listener: () => void): () => void {
    return subscribeToTable('plans', listener)
  }
}
