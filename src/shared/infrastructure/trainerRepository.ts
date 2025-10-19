import { supabase } from "../lib/supabaseClient"
import type { Trainer } from "../types/trainer"

export class TrainerRepository {
  async findByProfileId(profileId: string): Promise<Trainer | null> {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('profile_id', profileId)
      .single()
    
    if (error) throw error
    return data
  }
}