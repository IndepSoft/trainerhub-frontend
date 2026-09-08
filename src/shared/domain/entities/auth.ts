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
 * Con qué intención se da alguien de alta.
 *
 * ES UNA DECLARACIÓN, NO UNA AUTORIZACIÓN. Nadie comprueba que sea verdad, y no
 * hace falta: ni entrenar ni ser alumno autorizan nada por sí mismos. Lo que se
 * puede hacer en un equipo sale del PUESTO que se tenga en él, y eso lo concede
 * quien ya está dentro.
 *
 * Vive en `shared/domain` y no en el dominio de autenticación porque forma parte
 * de lo que se le pide al proveedor al crear la cuenta. `RegisterIntent`, el
 * nombre con el que la conoce el formulario, es un alias de este mismo tipo: una
 * sola definición y dos vocabularios.
 */
export type SignUpIntent = 'trainer' | 'student'

/**
 * Lo que se sabe de una persona en el momento de crearle la cuenta.
 *
 * NO ES EL PERFIL COMPLETO, y no debe serlo: es lo mínimo con lo que la cuenta
 * puede nacer sin quedarse anónima. Todo lo demás —foto, biografía— se edita
 * después, ya con sesión abierta, desde Configuración.
 *
 * Los campos del entrenador van opcionales porque un alumno no los tiene. Es la
 * alternativa a partir el tipo en dos y obligar al puerto de autenticación a
 * conocer los dos perfiles del dominio, que es justo lo que no debe conocer.
 */
export interface SignUpProfile {
  intent: SignUpIntent
  firstName: string
  lastName: string
  specialty?: string
  yearsOfExperience?: string
  location?: string
  /**
   * El código del equipo al que se quiere entrar, si ya se tiene.
   *
   * Viaja con el alta por lo mismo que la intención: es el único momento en que
   * el cliente puede decir algo, y el servidor lo honra en la misma transacción
   * que crea la cuenta. Un código que no vale no tumba el alta.
   */
  joinCode?: string
}

/**
 * Lo que hace falta para crear una cuenta.
 *
 * LLEVA EL PERFIL, y esto revierte una decisión anterior —«sólo la cuenta; el
 * perfil lo crea quien registra, contra su repositorio»—. No es un cambio de
 * gusto: lo fuerza la CONFIRMACIÓN POR CORREO.
 *
 * Con la confirmación activada, el alta devuelve el usuario pero NO abre sesión.
 * Sin sesión no hay `auth.uid()`, y sin `auth.uid()` las políticas de fila
 * rechazan cualquier escritura del perfil. Es decir: después del alta ya no hay
 * ningún momento en que el cliente pueda escribir quién es. O viaja con la
 * cuenta, o no llega nunca.
 *
 * Como efecto secundario desaparece el hueco que el propio código tenía
 * anotado: si la cuenta se creaba y el perfil fallaba, quedaba una cuenta sin
 * ficha y el siguiente intento chocaba con «ya existe ese correo». Ahora nacen
 * juntos o no nace ninguno.
 */
export interface SignUpCredentials {
  email: string
  password: string
  profile: SignUpProfile
}
