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
 * Alta de una cuenta nueva.
 *
 * Lleva el perfil junto a las credenciales porque se resuelven a la vez: el
 * proveedor crea la cuenta y con esos mismos datos se rellena su ficha. Pedirlos
 * en dos pasos dejaria cuentas a medias si el segundo fallara.
 *
 * Los nombres estan en ingles, como `Trainer`, aunque el formulario los recoja
 * en castellano: la traduccion ocurre en el hook, que es la frontera entre lo
 * que ve el usuario y lo que entiende el dominio.
 */
export interface RegisterCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
  specialty: string
  yearsOfExperience: string
  location: string
  /**
   * Con qué papel se da de alta esta persona.
   *
   * Es una PETICION, no una asignacion: el servidor sigue teniendo la ultima
   * palabra. El trigger `handle_new_user` comprueba primero si el correo esta en
   * `platform_admin_emails`, y eso gana sobre lo que pida el cliente. Por eso
   * `'admin'` no es un valor posible aqui: un rol que uno se concede a si mismo
   * no es un rol.
   */
  intent: 'trainer' | 'student'
}

/**
 * Resultado de un alta.
 *
 * `needsEmailConfirmation` existe porque el alta NO siempre deja sesion
 * iniciada: si el proyecto exige confirmar el correo, la cuenta queda creada
 * pero sin sesion, y la interfaz tiene que decirlo en vez de esperar una
 * redireccion que no va a llegar.
 */
export interface RegisterResult {
  user: AuthUser | null
  needsEmailConfirmation: boolean
}
