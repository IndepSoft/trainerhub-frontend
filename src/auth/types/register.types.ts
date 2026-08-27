/**
 * Datos del formulario de registro.
 *
 * Los campos pasan de castellano (`nombre`, `apellido`, `especialidad`) a
 * inglés, para hablar el mismo idioma que el resto del modelo: `Trainer` en
 * `shared/domain/entities` y `Student` en el dominio de estudiantes ya usan
 * `firstName` y `lastName`. Las etiquetas visibles siguen en castellano; lo que
 * se unifica es el código.
 */
export interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  specialty: string
  yearsOfExperience: string
  location: string
}

/** Campo del formulario, para tipar el manejador de cambios. */
export type RegisterFormField = keyof RegisterFormData
