import type { AuthPort } from '@/shared/domain/ports/AuthPort'
import type {
  AuthUser,
  LoginCredentials,
  SignUpCredentials,
} from '@/shared/domain/entities/auth'
import { AppError, AppErrorCode } from '@/shared/domain/errors'

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

export class FakeAuthAdapter implements AuthPort {
  private currentUser: AuthUser | null
  private readonly listeners: Set<AuthStateListener>

  constructor() {
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
      throw new AppError(AppErrorCode.VALIDATION, 'El email no tiene un formato válido')
    }

    if (credentials.password.length < MINIMUM_PASSWORD_LENGTH) {
      throw new AppError(
        AppErrorCode.VALIDATION,
        `La contraseña debe tener al menos ${MINIMUM_PASSWORD_LENGTH} caracteres`
      )
    }

    if (credentials.email === FAILING_EMAIL_ADDRESS) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'Email o contraseña incorrectos')
    }

    const user: AuthUser = {
      id: this.buildDeterministicIdentifier(credentials.email),
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
      throw new AppError(AppErrorCode.VALIDATION, 'El email no tiene un formato válido')
    }

    if (credentials.password.length < MINIMUM_PASSWORD_LENGTH) {
      throw new AppError(
        AppErrorCode.VALIDATION,
        `La contraseña debe tener al menos ${MINIMUM_PASSWORD_LENGTH} caracteres`
      )
    }

    if (credentials.email === FAILING_EMAIL_ADDRESS) {
      throw new AppError(AppErrorCode.VALIDATION, 'Ya existe una cuenta con ese correo')
    }

    const user: AuthUser = {
      id: this.buildDeterministicIdentifier(credentials.email),
      email: credentials.email,
    }

    // Deja la sesion abierta, que es el comportamiento de Supabase cuando la
    // confirmacion por correo esta desactivada. Con ella activada habria que
    // enviar a una pantalla de «revisa tu correo»; el dia que se active, el
    // cambio esta en el adaptador real, no aqui.
    this.persistSession(user)
    this.setCurrentUser(user)

    return user
  }

  async signInWithGoogle(): Promise<void> {
    const user: AuthUser = {
      id: this.buildDeterministicIdentifier('google@test.local'),
      email: 'google@test.local',
    }

    this.persistSession(user)
    this.setCurrentUser(user)
  }

  async signOut(): Promise<void> {
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

  /**
   * Deriva un identificador estable a partir del email, para que el mismo
   * correo produzca siempre el mismo `id` entre recargas y sesiones. Con un
   * valor aleatorio, cualquier dato asociado al usuario se perdería en cada
   * arranque.
   */
  private buildDeterministicIdentifier(emailAddress: string): string {
    let hash = 0
    for (let index = 0; index < emailAddress.length; index += 1) {
      hash = (hash << 5) - hash + emailAddress.charCodeAt(index)
      hash |= 0
    }
    const suffix = Math.abs(hash).toString(16).padStart(12, '0')
    return `00000000-0000-4000-8000-${suffix.slice(0, 12)}`
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
