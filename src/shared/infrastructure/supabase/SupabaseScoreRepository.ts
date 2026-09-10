import type {
  CrewMemberProgress,
  ProgressPeriod,
  ScoreRepository,
} from '@/shared/domain/ports/ScoreRepository'
import type { Cohort, SessionScore } from '@/shared/domain/entities/progress'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import {
  toCrewMemberProgress,
  toSessionScore,
  type CrewProgressRow,
  type SessionScoreRow,
} from './mappers'
import { subscribeToTable } from './realtime'

/**
 * Implementacion de ScoreRepository sobre `session_scores` y `crew_ranking`.
 *
 * Las puntuaciones las escribe el disparador de `sessions`; aqui solo se leen.
 * RLS decide cuales: el equipo tecnico las del crew, cada alumno las suyas. El
 * ranking sigue siendo una funcion `security definer` que devuelve agregados,
 * porque un alumno no puede leer las puntuaciones de sus compañeros.
 */
export class SupabaseScoreRepository implements ScoreRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async ofStudent(studentId: string): Promise<SessionScore[]> {
    const { data, error } = await supabase
      .from('session_scores')
      .select('*')
      .eq('student_id', studentId)
      .order('completed_on', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as SessionScoreRow[]).map(toSessionScore)
  }

  async ofSession(sessionId: string): Promise<SessionScore | null> {
    const { data, error } = await supabase
      .from('session_scores')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (error) throw mapDataError(error)
    return data === null ? null : toSessionScore(data as SessionScoreRow)
  }

  async ofCrew(period: ProgressPeriod, cohort: Cohort | null = null): Promise<CrewMemberProgress[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase.rpc('crew_ranking', { crew: crewId, period, cohort_filter: cohort })

    if (error) throw mapDataError(error)
    return ((data ?? []) as CrewProgressRow[]).map(toCrewMemberProgress)
  }

  async flaggedOf(studentId: string): Promise<SessionScore[]> {
    const { data, error } = await supabase
      .from('session_scores')
      .select('*')
      .eq('student_id', studentId)
      .not('flagged_reason', 'is', null)
      .is('reviewed_at', null)
      .order('completed_on', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as SessionScoreRow[]).map(toSessionScore)
  }

  async acceptLoadJump(sessionId: string): Promise<void> {
    const { error } = await supabase.rpc('accept_load_jump', { session: sessionId })
    if (error) throw mapDataError(error)
  }

  onChange(listener: () => void): () => void {
    return subscribeToTable('session_scores', listener)
  }
}
