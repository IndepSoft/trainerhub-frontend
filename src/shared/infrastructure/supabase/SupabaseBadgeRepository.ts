import type { BadgeRepository } from '@/shared/domain/ports/BadgeRepository'
import { BADGES_REQUIRING_VALIDATION, type StudentBadge } from '@/shared/domain/entities/progress'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toStudentBadge, type StudentBadgeRow } from './mappers'
import { subscribeToTable } from './realtime'

/**
 * Implementacion de BadgeRepository sobre `student_badges`.
 *
 * Solo lectura: las escribe `evaluate_badges` al cerrar una sesion, con los
 * privilegios del disparador. RLS deja ver las del propio alumno y las del
 * equipo que uno entrena.
 */
export class SupabaseBadgeRepository implements BadgeRepository {
  async unlockedOf(studentId: string): Promise<StudentBadge[]> {
    const { data, error } = await supabase
      .from('student_badges')
      .select('*')
      .eq('student_id', studentId)
      .order('unlocked_on', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as StudentBadgeRow[]).map(toStudentBadge)
  }

  async newIn(sessionId: string): Promise<StudentBadge[]> {
    const { data, error } = await supabase
      .from('student_badges')
      .select('*')
      .eq('session_id', sessionId)

    if (error) throw mapDataError(error)
    return ((data ?? []) as StudentBadgeRow[]).map(toStudentBadge)
  }

  /*
   * Sin filtro por equipo: RLS ya deja ver solo las del equipo que uno
   * entrena. Cuales exigen confirmacion lo sabe la entidad, no la consulta.
   */
  async pendingValidation(): Promise<StudentBadge[]> {
    const { data, error } = await supabase
      .from('student_badges')
      .select('*')
      .is('validated_at', null)
      .in('badge_code', BADGES_REQUIRING_VALIDATION)

    if (error) throw mapDataError(error)
    return ((data ?? []) as StudentBadgeRow[]).map(toStudentBadge)
  }

  async validate(studentId: string, code: string): Promise<void> {
    const { error } = await supabase.rpc('validate_badge', { student: studentId, code })
    if (error) throw mapDataError(error)
  }

  onChange(listener: () => void): () => void {
    return subscribeToTable('student_badges', listener)
  }
}
