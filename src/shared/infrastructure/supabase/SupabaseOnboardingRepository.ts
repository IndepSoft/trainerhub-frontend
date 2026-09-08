import type { OnboardingRepository } from '@/shared/domain/ports/OnboardingRepository'
import { supabase } from './client'
import { mapDataError } from './errorMapper'

/**
 * Implementacion de OnboardingRepository sobre `profiles.onboarded_at`.
 *
 * La fila es la de quien ha entrado; RLS solo deja leer y escribir la propia,
 * y la concesion de columnas solo deja tocar esta. Sin sesion no hay fila que
 * leer, y «no visto» es la respuesta segura: mejor repetir el recorrido que
 * ocultarselo a quien no lo vio.
 */
export class SupabaseOnboardingRepository implements OnboardingRepository {
  async hasSeen(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user === null) return false

    const { data, error } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw mapDataError(error)
    return (data as { onboarded_at: string | null } | null)?.onboarded_at != null
  }

  async markSeen(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user === null) return

    const { error } = await supabase
      .from('profiles')
      .update({ onboarded_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) throw mapDataError(error)
  }
}
