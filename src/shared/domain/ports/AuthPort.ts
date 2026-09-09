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

  signOut(): Promise<void>

  /**
   * Pide el correo para restablecer la contraseña.
   *
   * NO DICE SI LA CUENTA EXISTE. Resuelve igual con un correo desconocido, y a
   * proposito: distinguirlo dejaria comprobar desde el formulario quien tiene
   * cuenta y quien no. El enlace del correo abre la pantalla de nueva
   * contraseña ya con sesion, y ahi se llama a `updatePassword`.
   */
  requestPasswordReset(email: string): Promise<void>

  /**
   * Cambia la contraseña de la sesion vigente. Sirve para las dos puertas:
   * la vuelta del correo de recuperacion y Configuracion.
   */
  updatePassword(newPassword: string): Promise<void>

  /** Vuelve a mandar el correo de confirmacion del alta. */
  resendConfirmation(email: string): Promise<void>

  /**
   * Borra la cuenta de la sesion vigente y cierra la sesion.
   *
   * Lo que pasa con lo que deja detras -equipos, fichas, historial- lo decide
   * el otro lado, que es quien conoce las cascadas. Puede negarse: quien es el
   * unico administrador de un equipo con mas gente recibe `lastAdmin`.
   */
  deleteAccount(): Promise<void>

  /** Usuario de la sesion vigente, o null si no hay. */
  getCurrentUser(): Promise<AuthUser | null>

  /**
   * Notifica cambios de sesion (login, logout, refresco de token, otra pestaña).
   * Devuelve la funcion para darse de baja: quien suscribe debe llamarla.
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void
}
