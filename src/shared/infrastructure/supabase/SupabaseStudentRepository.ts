import type {
  ClaimMembershipInput,
  NewStudent,
  StudentProfile,
  StudentRepository,
} from '@/shared/domain/ports/StudentRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { MembershipStatus } from '@/shared/domain/entities/crew'
import type { Student } from '@/shared/domain/entities/student'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toStudent, toStudentProfileRow, toStudentRow, type StudentRow } from './mappers'
import { subscribeToTable } from './realtime'

/**
 * Implementacion de StudentRepository sobre PostgREST.
 *
 * EL AMBITO SIGUE AQUI, Y YA NO ES LA BARRERA. `scope.current()` dice en que
 * crew se trabaja y este adaptador filtra por el, como hacia la simulacion;
 * pero lo que impide ver las fichas de otro equipo es RLS, no este filtro. Con
 * el filtro quitado se veria lo mismo: nada que no sea suyo.
 *
 * DOS OPERACIONES SON FUNCIONES DEL SERVIDOR:
 *  - `claimMembership` es `claim_membership(token)`: valida el token en la
 *    misma transaccion que la escritura, que es lo que el puerto pedia.
 *  - `claimByEmail` ya no la hace el cliente: la hace el disparador del alta,
 *    antes de que exista sesion. Aqui queda como lectura de lo que ya se
 *    reclamo, para que quien la llame reciba lo que promete el contrato.
 */
export class SupabaseStudentRepository implements StudentRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<Student[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('crew_id', crewId)
      .in('membership_status', ['active', 'invited'])
      .order('created_at', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as StudentRow[]).map(toStudent)
  }

  async findRequests(): Promise<Student[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('crew_id', crewId)
      .eq('membership_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as StudentRow[]).map(toStudent)
  }

  async findById(studentId: string): Promise<Student | null> {
    const crewId = this.scope.current()
    if (crewId === null) return null

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .eq('crew_id', crewId)
      .maybeSingle()

    if (error) throw mapDataError(error)
    return data === null ? null : toStudent(data as StudentRow)
  }

  async findAllByProfileId(profileId: string): Promise<Student[]> {
    // Sin acotar, a proposito: son las fichas de uno mismo. RLS solo devuelve
    // las propias, asi que el filtro por `profile_id` es la pregunta, no la
    // barrera.
    const { data, error } = await supabase.from('students').select('*').eq('profile_id', profileId)

    if (error) throw mapDataError(error)
    return ((data ?? []) as StudentRow[]).map(toStudent)
  }

  async findByEmail(email: string): Promise<Student | null> {
    const crewId = this.scope.current()
    if (crewId === null) return null

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('crew_id', crewId)
      .ilike('email', email.trim())
      .maybeSingle()

    if (error) throw mapDataError(error)
    return data === null ? null : toStudent(data as StudentRow)
  }

  async claimByEmail(email: string, profileId: string): Promise<Student[]> {
    /*
     * Ya lo hizo el disparador `handle_new_user`, dentro de la transaccion que
     * creo la cuenta. Aqui se devuelve lo reclamado, que es lo que promete el
     * contrato; escribirlo otra vez desde el cliente seria la duplicacion que
     * el plan prohibe, y ademas no podria: al registrarse no hay sesion.
     */
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('profile_id', profileId)
      .ilike('email', email.trim())

    if (error) throw mapDataError(error)
    return ((data ?? []) as StudentRow[]).map(toStudent)
  }

  async create(data: NewStudent): Promise<Student> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new AppError(AppErrorCode.VALIDATION, 'noActiveCrew')
    }

    const { data: row, error } = await supabase
      .from('students')
      .insert({ crew_id: crewId, ...toStudentRow(data) })
      .select('*')
      .single()

    if (error) throw mapDataError(error)
    return toStudent(row as StudentRow)
  }

  async update(studentId: string, data: NewStudent): Promise<void> {
    // `crew_id` no viaja: editar una ficha no la mueve de crew, y el
    // disparador de la tabla lo rechazaria de todos modos.
    const { error } = await supabase.from('students').update(toStudentRow(data)).eq('id', studentId)

    if (error) throw mapDataError(error)
  }

  async linkAccount(studentId: string, profileId: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .update({ profile_id: profileId })
      .eq('id', studentId)

    if (error) throw mapDataError(error)
  }

  async updateProfile(studentId: string, data: StudentProfile): Promise<void> {
    const { error } = await supabase
      .from('students')
      .update(toStudentProfileRow(data))
      .eq('id', studentId)

    if (error) throw mapDataError(error)
  }

  async updateMembership(studentId: string, status: MembershipStatus): Promise<void> {
    const { error } = await supabase
      .from('students')
      .update({ membership_status: status })
      .eq('id', studentId)

    if (error) throw mapDataError(error)
  }

  async claimMembership(input: ClaimMembershipInput): Promise<Student> {
    // Por el TOKEN, no por el identificador del crew: el token es la llave, y
    // el servidor lo valida en la misma transaccion que escribe la ficha.
    const { data, error } = await supabase.rpc('claim_membership', { crew_token: input.joinToken })

    if (error) throw mapDataError(error)
    if (data === null) {
      throw new AppError(AppErrorCode.UNKNOWN, 'dataAccessFailed')
    }

    return toStudent(data as StudentRow)
  }

  async remove(studentId: string): Promise<void> {
    const { error } = await supabase.from('students').delete().eq('id', studentId)

    if (error) throw mapDataError(error)
  }

  /**
   * SIN ACOTAR AL EQUIPO ACTIVO, y es lo que hace que unirse a un equipo se
   * vea. La ficha nace en el crew al que se solicita entrar, que por definicion
   * todavia no es el activo; y cuando el entrenador aprueba la solicitud, el
   * cambio de estado le llega al alumno por su propia politica de lectura
   * -«cada alumno la suya»- sin que haya que adivinar en que crew mirar.
   */
  onChange(listener: () => void): () => void {
    return subscribeToTable('students', listener)
  }
}
