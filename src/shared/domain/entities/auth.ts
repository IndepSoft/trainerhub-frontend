/** Usuario autenticado, en terminos de la aplicacion. */
export interface AuthUser {
  id: string
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Lo que hace falta para crear una cuenta.
 *
 * Coincide hoy con `LoginCredentials` y aun asi se nombra aparte: son dos
 * operaciones distintas y van a divergir -el alta acabara llevando el token de
 * invitacion, y el login no-. Compartir el tipo por parecerse ahora obligaria a
 * separarlos justo cuando mas cuesta.
 */
export interface SignUpCredentials {
  email: string
  password: string
}
