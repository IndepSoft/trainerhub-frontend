import type { AuthUser, LoginCredentials, SignUpCredentials } from '../entities/auth'

/**
 * Puerto de autenticacion.
 *
 * Se describe en operaciones de negocio, no en las de ningun proveedor: aqui no
 * aparece "session", "JWT", "postgres_changes" ni nada de Supabase. Migrar a un
 * backend propio es escribir otra clase que cumpla esta interfaz.
 */
export interface AuthPort {
  signInWithEmail(credentials: LoginCredentials): Promise<AuthUser>

  /**
   * Crea la cuenta y devuelve el usuario.
   *
   * SOLO LA CUENTA. El perfil que va con ella -entrenador o alumno- lo crea
   * quien registra, contra su repositorio: es de lo que se deduce el rol, y
   * meterlo aqui obligaria al puerto de autenticacion a conocer a los dos.
   *
   * OJO con la confirmacion por correo: si el proveedor la exige, la cuenta
   * queda creada pero sin sesion abierta. Devolver el usuario no significa que
   * ya este dentro; eso se comprueba con `getCurrentUser`.
   */
  signUp(credentials: SignUpCredentials): Promise<AuthUser>

  /**
   * Arranca un login federado. No devuelve usuario: el proveedor redirige el
   * navegador y la sesion se resuelve al volver, via getCurrentUser/onChange.
   */
  signInWithGoogle(): Promise<void>

  signOut(): Promise<void>

  /** Usuario de la sesion vigente, o null si no hay. */
  getCurrentUser(): Promise<AuthUser | null>

  /**
   * Notifica cambios de sesion (login, logout, refresco de token, otra pestaña).
   * Devuelve la funcion para darse de baja: quien suscribe debe llamarla.
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void
}
