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
   * Crea la cuenta CON su perfil, y devuelve el usuario.
   *
   * DECIA «SOLO LA CUENTA» y ya no puede decirlo. El motivo esta explicado en
   * `SignUpCredentials`, y se resume asi: con la confirmacion por correo
   * activada el alta no abre sesion, y sin sesion el cliente no puede escribir
   * el perfil despues. O viaja con la cuenta, o no llega nunca.
   *
   * El puerto sigue sin conocer a los dos perfiles del dominio: recibe UNA
   * forma -`SignUpProfile`- con la intencion declarada dentro. Quien decide que
   * significa esa intencion es el otro lado; aqui solo se transporta.
   *
   * DEVOLVER EL USUARIO NO SIGNIFICA QUE YA ESTE DENTRO. Con la confirmacion
   * activada la cuenta queda creada y la sesion no; quien registra tiene que
   * comprobarlo con `getCurrentUser` antes de dar a nadie por identificado.
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
