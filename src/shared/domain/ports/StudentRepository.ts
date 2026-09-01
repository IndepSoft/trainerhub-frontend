import type { Student } from '../entities/student'

/**
 * Puerto de acceso a estudiantes.
 *
 * Métodos con intención de negocio, nunca constructores de consulta. Es lo que
 * permite que el calendario pida «los alumnos que puedo agendar» sin saber si
 * detrás hay Postgres, un backend propio o datos simulados.
 *
 * `findById` devuelve `null` cuando no existe, no una excepción: la ausencia es
 * un resultado válido —un enlace viejo, un identificador escrito a mano— y así
 * lo declara también `TrainerRepository`.
 */
export interface StudentRepository {
  findAll(): Promise<Student[]>
  findById(studentId: string): Promise<Student | null>
  /**
   * El alumno que entra con esta cuenta, o `null` si ninguna lo hace.
   *
   * Es como se deriva el rol: si responde, quien ha iniciado sesión es un
   * alumno. Misma forma que `TrainerRepository.findByProfileId`.
   */
  findByProfileId(profileId: string): Promise<Student | null>
  /** El alumno con este correo, para enlazarlo al registrarse. */
  findByEmail(email: string): Promise<Student | null>
  create(data: Omit<Student, 'id'>): Promise<Student>
  update(studentId: string, data: Omit<Student, 'id'>): Promise<void>
  /**
   * Ata la ficha de un alumno a la cuenta con la que acaba de registrarse.
   *
   * Operacion propia y no un `update` con la ficha entera: quien registra solo
   * sabe el identificador de la cuenta, y obligarle a leer al alumno para
   * volver a escribirlo completo abre una carrera -entre la lectura y la
   * escritura, el entrenador pudo cambiarle el nivel- y le hace conocer campos
   * que no le incumben.
   */
  linkAccount(studentId: string, profileId: string): Promise<void>

  remove(studentId: string): Promise<void>
  onChange(listener: () => void): () => void
}
