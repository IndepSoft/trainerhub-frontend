import type { NewTrainer, TrainerRepository } from '@/shared/domain/ports/TrainerRepository'
import type { Trainer } from '@/shared/domain/entities/trainer'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toTrainer, toTrainerRow, type TrainerRow } from './mappers'

/** Implementacion de TrainerRepository sobre PostgREST. */
export class SupabaseTrainerRepository implements TrainerRepository {
  async findByProfileId(profileId: string): Promise<Trainer | null> {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('profile_id', profileId)
      .single()

    if (error) {
      const appError = mapDataError(error)
      // "no encontrado" no es un fallo: es una respuesta valida del dominio.
      if (appError.code === AppErrorCode.NOT_FOUND) return null
      throw appError
    }

    return data ? toTrainer(data as TrainerRow) : null
  }

  async create(trainer: NewTrainer): Promise<Trainer> {
    const { data, error } = await supabase
      .from('trainers')
      .insert(toTrainerRow(trainer))
      // Se pide la fila de vuelta en el mismo viaje: la base rellena `id`,
      // `verified` y `total_reviews`, y sin `select` habria que ir a buscarla.
      .select('*')
      .single()

    if (error) throw mapDataError(error)
    if (!data) {
      throw new AppError(AppErrorCode.UNKNOWN, 'No se pudo crear el perfil de entrenador')
    }

    return toTrainer(data as TrainerRow)
  }
}
