/** Usuario autenticado, en terminos de la aplicacion. */
export interface AuthUser {
  id: string
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}
