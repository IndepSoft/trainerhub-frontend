import type { TrainerRepository } from '@/shared/domain/ports/TrainerRepository'
import type { Trainer } from '@/shared/domain/entities/trainer'
import { AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toTrainer, type TrainerRow } from './mappers'

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
}
