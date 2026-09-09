import type { AuthPort } from '@/shared/domain/ports/AuthPort'
import type {
  AuthUser,
  LoginCredentials,
  SignUpCredentials,
  SignUpProfile,
} from '@/shared/domain/entities/auth'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { profileIdFromEmail } from './devIdentity'

/**
 * Implementación de AuthPort en memoria, para desarrollo local sin depender de
 * un usuario real en Supabase Auth.
 *
 * NO es un atajo ni un parche: es una implementación legítima del puerto, y
 * existe precisamente porque la arquitectura permite sustituir el proveedor sin
 * tocar la aplicación. La diferencia con el `dev-user` que se eliminó de
 * `AuthService` es que aquello suplantaba al adaptador real dentro del camino de
 * producción; esto es un adaptador aparte, seleccionado explícitamente en la
 * raíz de composición y excluido del bundle de producción.
 *
 * Garantías de seguridad, en capas:
 *
 *  1. `container.ts` sólo lo elige bajo `import.meta.env.DEV`, que Vite
 *     reemplaza estáticamente por `false` al compilar. La rama se elimina por
 *     tree-shaking y esta clase no entra en el bundle de producción.
 *  2. Requiere además el flag explícito `VITE_USE_FAKE_AUTH=true`, de modo que
 *     ni siquiera en desarrollo se activa por defecto.
 *  3. Avisa por consola en cada arranque mientras está activo.
 */

const FAKE_SESSION_STORAGE_KEY = 'trainerhub.fake-auth.session'

/** Correo reservado para provocar un fallo y poder probar la UI de error. */
const FAILING_EMAIL_ADDRESS = 'error@test.local'

const MINIMUM_PASSWORD_LENGTH = 6

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type AuthStateListener = (user: AuthUser | null) => void

/**
 * Lo que en Supabase hace un disparador de Postgres: dejar constancia de quien
 * es la cuenta que acaba de nacer.
 *
 * Se inyecta desde la raiz de composicion en vez de hacerlo aqui dentro, y por
 * un motivo concreto: este adaptador no debe saber que existen entrenadores ni
 * alumnos. Sabe que una cuenta nace con un perfil y se lo pasa a quien si sabe
 * que hacer con el, que es exactamente el reparto que hay del otro lado.
 */
export type ProfileRecorder = (user: AuthUser, profile: SignUpProfile) => Promise<void>

export class FakeAuthAdapter implements AuthPort {
  private currentUser: AuthUser | null
  private readonly listeners: Set<AuthStateListener>
  /*
   * Campo declarado y asignado a mano, no una propiedad de parametro: el
   * `tsconfig` lleva `erasableSyntaxOnly`, que prohibe la forma corta porque no
   * se puede borrar sin dejar comportamiento detras.
   */
  private readonly recordProfile: ProfileRecorder

  constructor(recordProfile: ProfileRecorder) {
    this.recordProfile = recordProfile
    this.listeners = new Set<AuthStateListener>()
    this.currentUser = this.readPersistedSession()

    console.warn(
      '[FakeAuthAdapter] Autenticación simulada activa. ' +
        'Ningún usuario real de Supabase interviene. ' +
        'Desactívala quitando VITE_USE_FAKE_AUTH del archivo .env.'
    )
  }

  async signInWithEmail(credentials: LoginCredentials): Promise<AuthUser> {
    // Se validan las credenciales, aunque sean simuladas, para que el
    // formulario ejercite sus caminos de error igual que contra el proveedor.
    if (!EMAIL_PATTERN.test(credentials.email)) {
      throw new AppError(AppErrorCode.VALIDATION, 'invalidEmailFormat')
    }

    if (credentials.password.length < MINIMUM_PASSWORD_LENGTH) {
      throw new AppError(AppErrorCode.VALIDATION, 'passwordTooShort', undefined, {
        min: MINIMUM_PASSWORD_LENGTH,
      })
    }

    if (credentials.email === FAILING_EMAIL_ADDRESS) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'invalidCredentials')
    }

    const user: AuthUser = {
      id: profileIdFromEmail(credentials.email),
      email: credentials.email,
    }

    this.persistSession(user)
    this.setCurrentUser(user)

    return user
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthUser> {
    // Las mismas validaciones que el login, y por el mismo motivo: que el
    // formulario recorra sus caminos de error contra el adaptador falso
    // exactamente igual que contra el proveedor.
    if (!EMAIL_PATTERN.test(credentials.email)) {
      throw new AppError(AppErrorCode.VALIDATION, 'invalidEmailFormat')
    }

    if (credentials.password.length < MINIMUM_PASSWORD_LENGTH) {
      throw new AppError(AppErrorCode.VALIDATION, 'passwordTooShort', undefined, {
        min: MINIMUM_PASSWORD_LENGTH,
      })
    }

    if (credentials.email === FAILING_EMAIL_ADDRESS) {
      throw new AppError(AppErrorCode.VALIDATION, 'emailTaken')
    }

    const user: AuthUser = {
      id: profileIdFromEmail(credentials.email),
      email: credentials.email,
    }

    /*
     * El perfil ANTES de abrir la sesion, no despues.
     *
     * Abrir la sesion avisa a los oyentes, y de ahi arranca `useViewer`, que
     * pregunta quien ha entrado. Al reves, la primera respuesta seria «nadie
     * con ficha» y el recien registrado aterrizaria en la pantalla del alumno.
     * Del otro lado no hace falta pensarlo: el disparador corre dentro de la
     * misma transaccion que la cuenta.
     */
    await this.recordProfile(user, credentials.profile)

    /*
     * Deja la sesion abierta, que es el comportamiento de Supabase cuando la
     * confirmacion por correo esta DESACTIVADA.
     *
     * En el proyecto real esta activada, asi que alli el alta no abre sesion y
     * el registro manda a «revisa tu correo». Aqui se conserva la sesion abierta
     * a proposito: la simulacion existe para trabajar sin salir del navegador, y
     * un correo de confirmacion que nadie envia dejaria el desarrollo sin forma
     * de pasar del alta. Quien registra distingue los dos casos preguntando por
     * `getCurrentUser`, que es lo que dice el contrato del puerto.
     */
    this.persistSession(user)
    this.setCurrentUser(user)

    return user
  }

  async signOut(): Promise<void> {
    this.clearPersistedSession()
    this.setCurrentUser(null)
  }

  /*
   * Las tres operaciones de correo y contraseña no tienen nada que hacer en
   * memoria -no hay buzon ni contraseña guardada-, pero validan lo mismo que el
   * proveedor para que las pantallas recorran sus caminos de error.
   */
  async requestPasswordReset(email: string): Promise<void> {
    if (!EMAIL_PATTERN.test(email)) {
      throw new AppError(AppErrorCode.VALIDATION, 'invalidEmailFormat')
    }
    if (email === FAILING_EMAIL_ADDRESS) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'tooManyAttempts')
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    if (this.currentUser === null) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'sessionExpired')
    }
    if (newPassword.length < MINIMUM_PASSWORD_LENGTH) {
      throw new AppError(AppErrorCode.VALIDATION, 'passwordTooShort', undefined, {
        min: MINIMUM_PASSWORD_LENGTH,
      })
    }
  }

  async resendConfirmation(email: string): Promise<void> {
    if (!EMAIL_PATTERN.test(email)) {
      throw new AppError(AppErrorCode.VALIDATION, 'invalidEmailFormat')
    }
    if (email === FAILING_EMAIL_ADDRESS) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'tooManyAttempts')
    }
  }

  /*
   * En memoria no hay nada que borrar: las semillas no son de nadie y vuelven
   * al recargar. Lo que si se puede reproducir es la salida, que es lo que la
   * pantalla comprueba.
   */
  async deleteAccount(): Promise<void> {
    if (this.currentUser === null) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'sessionExpired')
    }
    this.clearPersistedSession()
    this.setCurrentUser(null)
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser
  }

  onAuthStateChange(callback: AuthStateListener): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private setCurrentUser(user: AuthUser | null): void {
    this.currentUser = user
    for (const listener of this.listeners) {
      listener(user)
    }
  }

  private persistSession(user: AuthUser): void {
    try {
      window.localStorage.setItem(FAKE_SESSION_STORAGE_KEY, JSON.stringify(user))
    } catch (error) {
      // Modo privado o almacenamiento deshabilitado: la sesión simplemente no
      // sobrevive a la recarga. No es motivo para interrumpir el login.
      console.warn('[FakeAuthAdapter] No se pudo guardar la sesión simulada.', error)
    }
  }

  private readPersistedSession(): AuthUser | null {
    try {
      const rawSession = window.localStorage.getItem(FAKE_SESSION_STORAGE_KEY)
      if (!rawSession) {
        return null
      }

      const parsedSession: unknown = JSON.parse(rawSession)
      return this.isAuthUser(parsedSession) ? parsedSession : null
    } catch {
      return null
    }
  }

  private clearPersistedSession(): void {
    try {
      window.localStorage.removeItem(FAKE_SESSION_STORAGE_KEY)
    } catch {
      // Sin almacenamiento no hay nada que limpiar.
    }
  }

  private isAuthUser(value: unknown): value is AuthUser {
    if (typeof value !== 'object' || value === null) {
      return false
    }

    const candidate = value as Record<string, unknown>
    return typeof candidate.id === 'string' && typeof candidate.email === 'string'
  }
}
