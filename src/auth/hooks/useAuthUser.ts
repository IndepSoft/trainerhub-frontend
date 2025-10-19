// auth/hooks/useAuthUser.ts
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/app/stores/authStore'
import { supabase } from '@/shared/lib/supabaseClient'
import type { PostgrestError } from '@supabase/supabase-js'

interface Trainer {
  id: number
  first_name: string
  last_name: string
  email?: string
  photo_url?: string
  profile_id: string
  bio?: string
  years_experience?: number
  verified?: boolean
  average_rating?: number
  total_reviews?: number
}

export function useAuthUser() {
  const user = useAuthStore((state) => state.user)
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchTrainer = async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('profile_id', user.id) 
        .single()
        
        if (error) {
        console.error('Error fetching trainer:', error)
        setError(error)
      } else {
        setTrainer(data)
      }
      setLoading(false)
    }
    fetchTrainer()
  }, [user?.id])

  return { trainer, loading, error }
}
