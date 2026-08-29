import type { StudentRepository } from '@/shared/domain/ports/StudentRepository'
import type { Student } from '@/shared/domain/entities/student'
import { studentsSeed } from './studentsSeed'

/**
 * Estudiantes simulados mientras no hay backend.
 *
 * La semilla vive junto a este adaptador y no dentro del dominio `students`:
 * los datos de prueba de una entidad compartida pertenecen a su implementación
 * falsa, igual que `FakeAuthAdapter` guarda su propio usuario. Si se quedaran en
 * el dominio, la infraestructura compartida tendría que importar de él, que es
 * el mismo acoplamiento al revés.
 *
 * Devuelve promesas aunque los datos sean síncronos: la forma del puerto tiene
 * que ser la misma que tendrá con red, o cambiar de adaptador obligaría a tocar
 * a todos los consumidores.
 */
export class FakeStudentRepository implements StudentRepository {
  async findAll(): Promise<Student[]> {
    return studentsSeed
  }

  async findById(studentId: string): Promise<Student | null> {
    return studentsSeed.find((student) => student.id === studentId) ?? null
  }
}
