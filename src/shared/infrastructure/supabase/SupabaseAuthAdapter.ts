import type { AuthPort } from '@/shared/domain/ports/AuthPort'
import type {
  AuthUser,
  LoginCredentials,
  SignUpCredentials,
} from '@/shared/domain/entities/auth'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapAuthError, mapDataError } from './errorMapper'
import { toAuthUser, toSignUpMetadata } from './mappers'

/** Implementacion de AuthPort sobre Supabase Auth. */
export class SupabaseAuthAdapter implements AuthPort {
  async signInWithEmail(credentials: LoginCredentials): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) throw mapAuthError(error)
    if (!data.user) {
      throw new AppError(AppErrorCode.UNKNOWN, 'userDataUnavailable')
    }

    return toAuthUser(data.user)
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        /*
         * EL PERFIL VIAJA AQUI, y el disparador `on_auth_user_created` lo
         * escribe en `profiles` dentro de la misma transaccion que la cuenta.
         *
         * Antes no se mandaba nada, con este motivo: «el rol NO se guarda en
         * user_metadata, que lo puede editar el propio cliente». El motivo
         * sigue siendo bueno y por eso el rol SIGUE sin salir de aqui: lo que
         * viaja es la INTENCION declarada, y quien la convierte en rol es el
         * disparador, que ademas decide `admin` contra `platform_admin_emails`
         * sin mirar estos metadatos. Un cliente modificado puede mentir sobre a
         * que viene, no sobre lo que puede.
         */
        data: toSignUpMetadata(credentials.profile),
        /*
         * A donde vuelve el enlace del correo de confirmacion.
         *
         * Sin esto manda a la Site URL configurada en el panel, que en un
         * proyecto recien creado apunta a otro puerto y deja al recien
         * registrado en una pagina que no existe.
         */
        emailRedirectTo: `${window.location.origin}/authentication`,
      },
    })

    if (error) throw mapAuthError(error)
    if (!data.user) {
      throw new AppError(AppErrorCode.UNKNOWN, 'accountNotCreated')
    }

    /*
     * `data.session` puede venir a null: es lo que pasa con la confirmacion por
     * correo activada, que es como esta este proyecto. No se mira aqui a
     * proposito -el puerto devuelve el usuario, no la sesion-; quien registra lo
     * comprueba con `getCurrentUser`, que es lo que dice el contrato.
     */
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
      throw new AppError(AppErrorCode.UNKNOWN, 'signOutFailed', error)
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      /*
       * El enlace del correo abre esta ruta con la sesion ya establecida:
       * `detectSessionInUrl` lee los tokens del fragmento y los cambia por una
       * sesion antes de que la pantalla pregunte. La ruta tiene que estar en
       * la lista blanca del panel, igual que la de confirmacion.
       */
      redirectTo: `${window.location.origin}/authentication/nueva-contrasena`,
    })

    if (error) throw mapAuthError(error)
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) throw mapAuthError(error)
  }

  async resendConfirmation(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/authentication` },
    })

    if (error) throw mapAuthError(error)
  }

  async deleteAccount(): Promise<void> {
    const { error } = await supabase.rpc('delete_account')
    if (error) throw mapDataError(error)

    /*
     * Solo la sesion LOCAL: la cuenta ya no existe y pedirle al servidor que
     * la cierre devolveria un error por una sesion que ya no es de nadie.
     */
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
    if (signOutError) {
      throw new AppError(AppErrorCode.UNKNOWN, 'signOutFailed', signOutError)
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
