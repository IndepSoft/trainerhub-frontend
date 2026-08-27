import type { AuthPort } from '@/shared/domain/ports/AuthPort'
import type { TrainerRepository } from '@/shared/domain/ports/TrainerRepository'
import { SupabaseAuthAdapter } from '@/shared/infrastructure/supabase/SupabaseAuthAdapter'
import { SupabaseTrainerRepository } from '@/shared/infrastructure/supabase/SupabaseTrainerRepository'

/**
 * Raiz de composicion.
 *
 * Este es el unico fichero de la aplicacion que nombra una implementacion
 * concreta. Migrar a un backend propio consiste en escribir los adaptadores
 * nuevos y cambiar estas dos lineas; ni un hook ni un componente se entera.
 *
 * Los consumidores importan `container` y tipan contra los puertos, nunca
 * contra las clases Supabase*.
 */
export interface Container {
  auth: AuthPort
  trainers: TrainerRepository
}

export const container: Container = {
  auth: new SupabaseAuthAdapter(),
  trainers: new SupabaseTrainerRepository(),
}
