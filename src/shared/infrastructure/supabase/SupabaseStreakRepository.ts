import type { StreakPauseInput, StreakRepository } from '@/shared/domain/ports/StreakRepository'
import type { StreakPause } from '@/shared/domain/entities/progress'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toStreakPause, type StreakPauseRow } from './mappers'
import { subscribeToTable } from './realtime'

/**
 * Implementacion de StreakRepository sobre `streak_pauses` y sus funciones.
 *
 * Leer es la tabla, que RLS acota al propio alumno y a su equipo tecnico.
 * Escribir son funciones: `pause_streak` exige `students.manage`;
 * `use_streak_wildcard` exige ser el alumno y tener comodines, que la base
 * cuenta cada vez.
 */
export class SupabaseStreakRepository implements StreakRepository {
  async pausesOf(studentId: string): Promise<StreakPause[]> {
    const { data, error } = await supabase
      .from('streak_pauses')
      .select('*')
      .eq('student_id', studentId)
      .order('from_day', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as StreakPauseRow[]).map(toStreakPause)
  }

  async wildcardsAvailable(studentId: string): Promise<number> {
    const { data, error } = await supabase.rpc('wildcards_available', { student: studentId })
    if (error) throw mapDataError(error)
    return typeof data === 'number' ? data : Number(data ?? 0)
  }

  async pause(input: StreakPauseInput): Promise<void> {
    const { error } = await supabase.rpc('pause_streak', {
      student: input.studentId,
      from_day: input.fromDay,
      to_day: input.toDay,
      pause_reason: input.reason,
    })
    if (error) throw mapDataError(error)
  }

  async useWildcard(studentId: string, day: string): Promise<void> {
    const { error } = await supabase.rpc('use_streak_wildcard', { student: studentId, day })
    if (error) throw mapDataError(error)
  }

  onChange(listener: () => void): () => void {
    return subscribeToTable('streak_pauses', listener)
  }
}
