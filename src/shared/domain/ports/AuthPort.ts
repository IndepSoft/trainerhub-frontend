import type { AuthUser, LoginCredentials } from '../entities/auth'

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
