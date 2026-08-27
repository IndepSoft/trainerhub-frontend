import { create } from 'zustand'
import { container } from '@/app/container'
import type { AuthUser } from '@/shared/domain/entities/auth'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  setUser: (user: AuthUser | null) => void
  logout: () => Promise<void>
  initializeAuth: () => Promise<void>
  /** Cancela la suscripcion a cambios de sesion. */
  disposeAuth: () => void
}

let unsubscribe: (() => void) | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),

  logout: async () => {
    await container.auth.signOut()
    set({ user: null })
  },

  initializeAuth: async () => {
    if (get().initialized) return

    try {
      const user = await container.auth.getCurrentUser()
      set({ user, loading: false, initialized: true })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ user: null, loading: false, initialized: true })
    }

    // La baja se guarda: antes se descartaba y la suscripcion quedaba viva.
    unsubscribe?.()
    unsubscribe = container.auth.onAuthStateChange((user) => set({ user }))
  },

  disposeAuth: () => {
    unsubscribe?.()
    unsubscribe = null
    set({ initialized: false })
  },
}))
