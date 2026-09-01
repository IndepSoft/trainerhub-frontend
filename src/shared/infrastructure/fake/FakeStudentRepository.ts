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
 *
 * TODO: los datos viven sólo en memoria. Al recargar vuelve la semilla.
 */
export class FakeStudentRepository implements StudentRepository {
  private students: Student[] = studentsSeed
  private readonly listeners = new Set<() => void>()

  async findAll(): Promise<Student[]> {
    return this.students
  }

  async findById(studentId: string): Promise<Student | null> {
    return this.students.find((student) => student.id === studentId) ?? null
  }

  async findByProfileId(profileId: string): Promise<Student | null> {
    return this.students.find((student) => student.profileId === profileId) ?? null
  }

  async findByEmail(email: string): Promise<Student | null> {
    // Sin distinguir mayúsculas: nadie escribe su correo dos veces igual, y el
    // enlace de una cuenta con su ficha no puede depender de eso.
    const normalized = email.trim().toLowerCase()
    return this.students.find((student) => student.email.toLowerCase() === normalized) ?? null
  }

  async create(data: Omit<Student, 'id'>): Promise<Student> {
    const student: Student = { id: crypto.randomUUID(), ...data }
    // Delante: el entrenador acaba de darlo de alta y espera verlo.
    this.students = [student, ...this.students]
    this.notify()
    return student
  }

  async update(studentId: string, data: Omit<Student, 'id'>): Promise<void> {
    this.students = this.students.map((student) =>
      student.id === studentId ? { id: studentId, ...data } : student
    )
    this.notify()
  }

  async linkAccount(studentId: string, profileId: string): Promise<void> {
    this.students = this.students.map((student) =>
      student.id === studentId ? { ...student, profileId } : student
    )
    this.notify()
  }

  async remove(studentId: string): Promise<void> {
    this.students = this.students.filter((student) => student.id !== studentId)
    this.notify()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
