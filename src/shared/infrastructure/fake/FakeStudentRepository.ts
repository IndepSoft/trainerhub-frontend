import type {
  ClaimMembershipInput,
  NewStudent,
  StudentRepository,
} from '@/shared/domain/ports/StudentRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import { isMember } from '@/shared/domain/entities/crew'
import type { MembershipStatus } from '@/shared/domain/entities/crew'
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
 * EL FILTRADO POR CREW LO HACE ESTA CLASE. Es lo que hará Postgres con RLS
 * cuando exista, y por eso el ámbito no aparece en la firma de ningún método:
 * está razonado en `CrewScope`.
 *
 * TODO: los datos viven sólo en memoria. Al recargar vuelve la semilla.
 */
export class FakeStudentRepository implements StudentRepository {
  private students: Student[] = studentsSeed
  private readonly listeners = new Set<() => void>()
  // Campo declarado y asignado, no propiedad de parametro: `erasableSyntaxOnly`
  // esta activo en el `tsconfig`, y esa azucar de TypeScript emite codigo.
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<Student[]> {
    return this.inScope().filter((student) => isMember(student.membershipStatus))
  }

  async findRequests(): Promise<Student[]> {
    return this.inScope().filter((student) => student.membershipStatus === 'pending')
  }

  async findById(studentId: string): Promise<Student | null> {
    // Sobre `inScope` y no sobre `findAll`: una solicitud pendiente tiene que
    // poder leerse para aceptarla, aunque no aparezca en el padrón.
    return this.inScope().find((student) => student.id === studentId) ?? null
  }

  async findAllByProfileId(profileId: string): Promise<Student[]> {
    // Sin acotar, a propósito: son las fichas de uno mismo, y es como se
    // descubre a qué crews pertenece. Está razonado en el puerto.
    return this.students.filter((student) => student.profileId === profileId)
  }

  async findByEmail(email: string): Promise<Student | null> {
    // Sin distinguir mayúsculas: nadie escribe su correo dos veces igual, y el
    // enlace de una cuenta con su ficha no puede depender de eso.
    const normalized = email.trim().toLowerCase()
    return this.inScope().find((student) => student.email.toLowerCase() === normalized) ?? null
  }

  async claimByEmail(email: string, profileId: string): Promise<Student[]> {
    const normalized = email.trim().toLowerCase()

    // Sin acotar, a proposito: al registrarse no hay crew activo todavia.
    const waiting = this.students.filter(
      (student) =>
        student.email.toLowerCase() === normalized &&
        // Solo las que esperan dueño. Una ficha ya enlazada a otra cuenta no se
        // reclama por escribir el mismo correo: seria suplantar a alguien.
        student.profileId === null &&
        student.membershipStatus === 'invited'
    )

    if (waiting.length === 0) return []

    const claimedIds = new Set(waiting.map((student) => student.id))
    this.students = this.students.map((student) =>
      claimedIds.has(student.id)
        ? { ...student, profileId, membershipStatus: 'active' as const }
        : student
    )
    this.notify()

    return this.students.filter((student) => claimedIds.has(student.id))
  }

  async create(data: NewStudent): Promise<Student> {
    const crewId = this.scope.current()
    if (crewId === null) {
      // Una ficha sin crew sería un huérfano invisible: no la vería nadie,
      // porque toda lectura está acotada. Mejor fallar aquí que escribir algo
      // que después no aparece y nadie sabe por qué.
      throw new Error('No hay ningún crew activo: una ficha de alumno pertenece a un crew.')
    }

    const student: Student = { id: crypto.randomUUID(), crewId, ...data }
    // Delante: el entrenador acaba de darlo de alta y espera verlo.
    this.students = [student, ...this.students]
    this.notify()
    return student
  }

  async update(studentId: string, data: NewStudent): Promise<void> {
    this.students = this.students.map((student) =>
      // `crewId` se conserva: editar una ficha no la mueve de crew.
      student.id === studentId ? { ...student, ...data } : student
    )
    this.notify()
  }

  async linkAccount(studentId: string, profileId: string): Promise<void> {
    this.students = this.students.map((student) =>
      student.id === studentId ? { ...student, profileId } : student
    )
    this.notify()
  }

  async updateMembership(studentId: string, status: MembershipStatus): Promise<void> {
    this.students = this.students.map((student) =>
      student.id === studentId ? { ...student, membershipStatus: status } : student
    )
    this.notify()
  }

  async claimMembership(input: ClaimMembershipInput): Promise<Student> {
    const normalized = input.email.trim().toLowerCase()

    // Por cuenta o por correo, y hacen falta las dos: por cuenta se encuentra
    // una solicitud anterior suya; por correo, la ficha que el entrenador creó
    // antes de que existiera la cuenta. Esa segunda es la que evita el duplicado.
    const existing = this.students.find(
      (student) =>
        student.crewId === input.crewId &&
        (student.profileId === input.profileId ||
          student.email.toLowerCase() === normalized)
    )

    if (existing !== undefined) {
      const claimed: Student = {
        ...existing,
        profileId: input.profileId,
        membershipStatus: input.status,
      }
      this.students = this.students.map((student) =>
        student.id === existing.id ? claimed : student
      )
      this.notify()
      return claimed
    }

    const student: Student = {
      id: crypto.randomUUID(),
      crewId: input.crewId,
      /*
       * TODO: el nombre sale del correo porque no hay perfil de persona:
       * `AuthUser` sólo tiene identificador y correo. En cuanto exista uno con
       * nombre y apellidos, el alta debe tomarlos de ahí. Mientras tanto lo
       * corrige el entrenador al aprobar la solicitud, que es cuando la mira.
       */
      firstName: normalized.split('@')[0],
      lastName: '',
      email: input.email.trim(),
      level: 'Principiante',
      goals: [],
      age: 0,
      bodyFatPercentage: 0,
      photoUrl: undefined,
      membershipStatus: input.status,
      profileId: input.profileId,
    }

    this.students = [student, ...this.students]
    this.notify()
    return student
  }

  async remove(studentId: string): Promise<void> {
    this.students = this.students.filter((student) => student.id !== studentId)
    this.notify()
  }

  /**
   * Cuantos miembros tiene un crew, sea cual sea el activo.
   *
   * Fuera del puerto por lo mismo que `FakeCrewRepository.listAll`: cruza el
   * ambito, y solo se la entrega la raiz de composicion a la plataforma.
   */
  countMembersOf(crewId: string): number {
    return this.students.filter(
      (student) => student.crewId === crewId && isMember(student.membershipStatus)
    ).length
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Los alumnos del crew activo.
   *
   * Sin crew activo devuelve vacío, y no todos: es el caso de un alumno recién
   * registrado, y enseñarle el padrón entero sería justo el fallo de aislamiento
   * que todo esto existe para evitar.
   */
  private inScope(): Student[] {
    const crewId = this.scope.current()
    if (crewId === null) return []
    return this.students.filter(
      (student) =>
        student.crewId === crewId &&
        // Un rechazado nunca llegó a ser alumno: no está en el padrón, no se le
        // puede agendar y no cuenta para nada. La fila se conserva para que
        // volver a escanear el QR no cree una solicitud nueva cada vez.
        student.membershipStatus !== 'rejected'
    )
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
