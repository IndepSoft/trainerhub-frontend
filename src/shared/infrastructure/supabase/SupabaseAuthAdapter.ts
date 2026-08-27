import type { AuthPort } from '@/shared/domain/ports/AuthPort'
import type { AuthUser, LoginCredentials } from '@/shared/domain/entities/auth'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapAuthError } from './errorMapper'
import { toAuthUser } from './mappers'

/** Implementacion de AuthPort sobre Supabase Auth. */
export class SupabaseAuthAdapter implements AuthPort {
  async signInWithEmail(credentials: LoginCredentials): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) throw mapAuthError(error)
    if (!data.user) {
      throw new AppError(AppErrorCode.UNKNOWN, 'No se pudo obtener datos del usuario')
    }

    return toAuthUser(data.user)
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })

    if (error) throw mapAuthError(error)
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new AppError(AppErrorCode.UNKNOWN, 'Error al cerrar sesión', error)
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.getSession()

    if (error) throw mapAuthError(error)
    return data.session?.user ? toAuthUser(data.session.user) : null
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? toAuthUser(session.user) : null)
    })

    return () => data.subscription.unsubscribe()
  }
}
