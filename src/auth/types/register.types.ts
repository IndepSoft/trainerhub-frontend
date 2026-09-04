/**
 * Con qué intención se registra alguien.
 *
 * ES UNA DECLARACIÓN, NO UNA AUTORIZACIÓN, y conviene tenerlo claro porque el
 * formulario no comprueba nada: cualquiera puede decir «soy entrenador». Eso es
 * seguro precisamente porque lo que vale —incorporar alumnos a un equipo— está
 * detrás de una suscripción que activa la plataforma. Registrarse como
 * entrenador sin serlo da un equipo vacío en el que no se puede meter a nadie.
 *
 * El rol de verdad se sigue deduciendo de quién te conoce, nunca de esto.
 */
export type RegisterIntent = 'trainer' | 'student'

/**
 * Datos del formulario de registro.
 *
 * Los campos pasan de castellano (`nombre`, `apellido`, `especialidad`) a
 * inglés, para hablar el mismo idioma que el resto del modelo: `Trainer` en
 * `shared/domain/entities` y `Student` en el dominio de estudiantes ya usan
 * `firstName` y `lastName`. Las etiquetas visibles siguen en castellano; lo que
 * se unifica es el código.
 *
 * UN SOLO BORRADOR PARA LOS DOS FORMULARIOS, y los campos que no le tocan al rol
 * elegido se quedan vacíos y no se leen: `submit` sólo mira los suyos y
 * `REQUIRED_BY_INTENT` sólo exige los suyos. La alternativa era una unión
 * discriminada, y obligaba a tirar lo escrito al cambiar de rol —que es
 * exactamente lo que hace alguien que se equivoca de pestaña y vuelve—.
 */
export interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  /** Sólo entrenador. */
  specialty: string
  /** Sólo entrenador. */
  yearsOfExperience: string
  /** Sólo entrenador. */
  location: string
  /**
   * Sólo alumno: el código del equipo al que se une, si ya lo tiene.
   *
   * Opcional a propósito. Quien viene del QR no lo escribe —vuelve solo a la
   * pantalla de unirse—, y quien se registra por su cuenta todavía no lo tiene:
   * exigirlo dejaría fuera al que se apunta antes de hablar con nadie.
   */
  joinCode: string
}

/** Campo del formulario, para tipar el manejador de cambios. */
export type RegisterFormField = keyof RegisterFormData
