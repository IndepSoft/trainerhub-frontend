import type { CatalogRepository } from '@/shared/domain/ports/CatalogRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { Equipment, TrainingCatalog } from '@/shared/domain/entities/catalog'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import {
  toEquipment,
  toEquipmentRow,
  toMovementPattern,
  toMuscleGroup,
  toTrainingObjective,
  toTrainingSplit,
  type EquipmentRow,
  type MovementPatternRow,
  type MuscleGroupRow,
  type TrainingObjectiveRow,
  type TrainingSplitRow,
} from './mappers'

/**
 * Implementacion de CatalogRepository sobre PostgREST.
 *
 * Las cinco tablas se piden EN PARALELO y se devuelven juntas: se resuelven a
 * la vez al pintar cualquier rutina o plan, y encadenarlas sumaria cinco
 * latencias para una pantalla. Cuatro son de sistema y solo se leen; el
 * material admite altas del equipo, que conviven con el de sistema en la misma
 * lista y con `crew_id` nulo distinguiendo unos de otros.
 */
export class SupabaseCatalogRepository implements CatalogRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<TrainingCatalog> {
    const crewId = this.scope.current()

    let equipmentQuery = supabase.from('equipment').select('*').order('name')
    equipmentQuery =
      crewId === null
        ? equipmentQuery.is('crew_id', null)
        : equipmentQuery.or(`crew_id.is.null,crew_id.eq.${crewId}`)

    const [muscleGroups, movementPatterns, equipment, objectives, splits] = await Promise.all([
      supabase.from('muscle_groups').select('*').order('name'),
      supabase.from('movement_patterns').select('*').order('name'),
      equipmentQuery,
      supabase.from('training_objectives').select('*').order('name'),
      supabase.from('training_splits').select('*').order('sessions_per_week'),
    ])

    for (const result of [muscleGroups, movementPatterns, equipment, objectives, splits]) {
      if (result.error) throw mapDataError(result.error)
    }

    return {
      muscleGroups: ((muscleGroups.data ?? []) as MuscleGroupRow[]).map(toMuscleGroup),
      movementPatterns: ((movementPatterns.data ?? []) as MovementPatternRow[]).map(toMovementPattern),
      equipment: ((equipment.data ?? []) as EquipmentRow[]).map(toEquipment),
      objectives: ((objectives.data ?? []) as TrainingObjectiveRow[]).map(toTrainingObjective),
      splits: ((splits.data ?? []) as TrainingSplitRow[]).map(toTrainingSplit),
    }
  }

  async createEquipment(data: Omit<Equipment, 'id'>): Promise<Equipment> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new AppError(AppErrorCode.VALIDATION, 'noActiveCrew')
    }

    const { data: row, error } = await supabase
      .from('equipment')
      .insert({ crew_id: crewId, ...toEquipmentRow(data) })
      .select('*')
      .single()

    if (error) throw mapDataError(error)
    return toEquipment(row as EquipmentRow)
  }

  async updateEquipment(equipmentId: string, data: Omit<Equipment, 'id'>): Promise<void> {
    const { error } = await supabase.from('equipment').update(toEquipmentRow(data)).eq('id', equipmentId)

    if (error) throw mapDataError(error)
  }

  async removeEquipment(equipmentId: string): Promise<void> {
    // Material con el que se ejecuta algun ejercicio no se borra: `on delete
    // restrict` en `exercises.equipment_id`. La pantalla lo comprueba antes; la
    // base lo garantiza.
    const { error } = await supabase.from('equipment').delete().eq('id', equipmentId)

    if (error) throw mapDataError(error)
  }

  /** TODO: sin suscripcion todavia. Ver el plan, §1.3. */
  onChange(): () => void {
    return () => undefined
  }
}
