import type { AuthPort } from '@/shared/domain/ports/AuthPort'
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  RegisterResult,
} from '@/shared/domain/entities/auth'
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

  async signUp(credentials: RegisterCredentials): Promise<RegisterResult> {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        /*
         * El perfil viaja como metadatos del alta, y no como un INSERT posterior
         * desde el cliente, por dos motivos.
         *
         * De correccion: el trigger `handle_new_user` crea la fila de `profiles`
         * en la misma transaccion que la cuenta. Insertarla despues dejaria
         * cuentas sin perfil si ese segundo paso fallara.
         *
         * Y de seguridad: es ese trigger, en SECURITY DEFINER, quien decide el
         * rol consultando `platform_admin_emails`. Si el rol saliera de aqui,
         * cualquiera podria pedir el suyo.
         *
         * Las claves van en snake_case porque son las que lee el trigger.
         */
        data: {
          first_name: credentials.firstName,
          last_name: credentials.lastName,
          specialty: credentials.specialty,
          years_of_experience: credentials.yearsOfExperience,
          location: credentials.location,
          // El trigger lo lee para distinguir el alta de entrenador de la de
          // alumno. Sin esta clave cae al caso por defecto y todo el mundo
          // entraria como alumno, que es justo lo que pasaba antes de mirarlo.
          intent: credentials.intent,
        },
        emailRedirectTo: `${window.location.origin}/authentication`,
      },
    })

    if (error) throw mapAuthError(error)

    /*
     * Con la confirmacion por correo activada, Supabase devuelve el usuario pero
     * `session` en null. Ese null es la señal de que falta confirmar, no un
     * fallo.
     */
    return {
      user: data.user ? toAuthUser(data.user) : null,
      needsEmailConfirmation: data.session === null,
    }
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
