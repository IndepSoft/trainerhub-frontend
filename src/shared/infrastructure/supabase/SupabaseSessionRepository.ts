import type { NewSession, SessionRepository } from '@/shared/domain/ports/SessionRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { Session, SessionResult, SessionStatus } from '@/shared/domain/entities/session'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toSession, toSessionRow, type SessionRow } from './mappers'

/**
 * Implementacion de SessionRepository sobre PostgREST.
 *
 * EL AMBITO SIGUE AQUI Y YA NO ES LA BARRERA. Se filtra por el crew activo
 * porque es lo que la pantalla pregunta; que un alumno vea solo sus sesiones y
 * las grupales lo decide RLS, no `scope.asStudent()`: la politica es la misma
 * regla que aplicaba la simulacion, ahora donde no se puede saltar.
 *
 * DOS OPERACIONES SON FUNCIONES DEL SERVIDOR: `complete` escribe estado y
 * resultado en una sola transaccion, y el volcado de un plan a la agenda -que
 * hoy llega serie a serie por `create`- tiene `create_sessions` esperandole
 * para cuando el hook de volcado pase a mandar el lote entero (plan, §6).
 */
export class SupabaseSessionRepository implements SessionRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<Session[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('crew_id', crewId)
      .order('date')
      .order('time')

    if (error) throw mapDataError(error)
    return ((data ?? []) as SessionRow[]).map(toSession)
  }

  async findById(sessionId: string): Promise<Session | null> {
    const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle()

    if (error) throw mapDataError(error)
    return data === null ? null : toSession(data as SessionRow)
  }

  async findByStudent(studentId: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('student_id', studentId)
      .order('date')
      .order('time')

    if (error) throw mapDataError(error)
    return ((data ?? []) as SessionRow[]).map(toSession)
  }

  async findByDate(date: string): Promise<Session[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('crew_id', crewId)
      .eq('date', date)
      .order('time')

    if (error) throw mapDataError(error)
    return ((data ?? []) as SessionRow[]).map(toSession)
  }

  async findBetween(from: string, to: string): Promise<Session[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('crew_id', crewId)
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('time')

    if (error) throw mapDataError(error)
    return ((data ?? []) as SessionRow[]).map(toSession)
  }

  async create(data: NewSession): Promise<Session> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new AppError(AppErrorCode.VALIDATION, 'noActiveCrew')
    }

    const { data: row, error } = await supabase
      .from('sessions')
      .insert({ crew_id: crewId, ...toSessionRow(data) })
      .select('*')
      .single()

    if (error) throw mapDataError(error)
    return toSession(row as SessionRow)
  }

  async update(sessionId: string, data: NewSession): Promise<void> {
    const { error } = await supabase.from('sessions').update(toSessionRow(data)).eq('id', sessionId)

    if (error) throw mapDataError(error)
  }

  async updateStatus(sessionId: string, status: SessionStatus): Promise<void> {
    const { error } = await supabase.from('sessions').update({ status }).eq('id', sessionId)

    if (error) throw mapDataError(error)
  }

  async complete(sessionId: string, result: SessionResult): Promise<void> {
    // Estado y resultado en una sola escritura, en el servidor: entre dos
    // escrituras desde aqui cabia quedarse con una.
    const { error } = await supabase.rpc('complete_session', {
      session: sessionId,
      session_result: result,
    })

    if (error) throw mapDataError(error)
  }

  async remove(sessionId: string): Promise<void> {
    const { error } = await supabase.from('sessions').delete().eq('id', sessionId)

    if (error) throw mapDataError(error)
  }

  /** TODO: sin suscripcion todavia. La agenda es la tercera en la lista del plan, §1.3. */
  onChange(): () => void {
    return () => undefined
  }
}
