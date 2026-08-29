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
}
