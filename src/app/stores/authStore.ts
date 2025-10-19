import { create } from 'zustand'
import { supabase } from '@/shared/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },

  initializeAuth: async () => {
    if (get().initialized) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ 
        user: session?.user ?? null, 
        loading: false,
        initialized: true 
      })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null })
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false, initialized: true })
    }
  },
}))