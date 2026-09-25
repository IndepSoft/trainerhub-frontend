import { create } from 'zustand'
import { container } from '@/app/container'
import { clearQueryCache } from '@/shared/lib/queryCache'
import { setActiveCrew } from '@/app/crewScope'
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
    /*
     * El ambito se suelta con la sesion. Vivia en `localStorage` y nadie lo
     * borraba, asi que en un dispositivo compartido quien entraba despues
     * heredaba el equipo activo del anterior. Con datos simulados era una
     * molestia; con datos reales es una fuga.
     */
    setActiveCrew(null)
    /*
     * Y con el ambito se va lo leido. La cache de lecturas existe para que
     * volver a un modulo no empiece de cero, pero lo de quien acaba de salir no
     * puede parpadear en la pantalla de quien entre despues en este mismo
     * telefono. Mismo motivo que soltar el equipo activo.
     */
    clearQueryCache()
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
