import { supabase } from '@/shared/lib/supabaseClient'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export class AuthService {

  //   async loginWithEmail(credentials: LoginCredentials): Promise<AuthUser> {
   
  //     const { data, error } = await supabase.auth.signInWithPassword({
  //     email: credentials.email,
  //     password: credentials.password,
  //  })

  //   if (error) {
  //     throw new Error(this.mapErrorMessage(error.message))
  //   }

  //   if (!data.user) {
  //     throw new Error('No se pudo obtener datos del usuario')
  //   }

  //   return this.mapToAuthUser(data.user)
  // }

  async loginWithEmail(credentials: LoginCredentials): Promise<AuthUser> {
  return {
    id: 'dev-user',
    email: credentials.email
  }
}

  async loginWithGoogle(): Promise<void> {
    return
    // const { error } = await supabase.auth.signInWithOAuth({
    //   provider: 'google',
    //   options: {
    //     redirectTo: `${window.location.origin}/dashboard`,
    //   },
    // })

    // if (error) {
    //   throw new Error(this.mapErrorMessage(error.message))
    // }
  }

  async getCurrentSession(): Promise<AuthUser | null> {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return null
    }

    if (!session?.user) {
      return null
    }

    return this.mapToAuthUser(session.user)
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error('Error al cerrar sesión')
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const user = session?.user ? this.mapToAuthUser(session.user) : null
        callback(user)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }

  private mapToAuthUser(supabaseUser: any): AuthUser {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
    }
  }

  // private mapErrorMessage(errorMessage: string): string {
  //   const errorMap: Record<string, string> = {
  //     'Invalid login credentials': 'Email o contraseña incorrectos',
  //     'Email not confirmed': 'Por favor confirma tu email',
  //     'User not found': 'Usuario no encontrado',
  //     'Email rate limit exceeded': 'Demasiados intentos, intenta más tarde',
  //   }

  //   return errorMap[errorMessage] || 'Error al iniciar sesión. Intenta nuevamente.'
  // }
}

export const authService = new AuthService()