import type { NewNotice, NoticeRepository } from '@/shared/domain/ports/NoticeRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { Notice } from '@/shared/domain/entities/notice'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toNotice, type NoticeRow } from './mappers'

/**
 * Implementacion de NoticeRepository sobre PostgREST.
 *
 * `findForStudent` va por destinatario, como dice el puerto, y RLS hace que
 * preguntar por otro devuelva vacio: un aviso es entre dos personas.
 */
export class SupabaseNoticeRepository implements NoticeRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findForStudent(studentId: string): Promise<Notice[]> {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as NoticeRow[]).map(toNotice)
  }

  async send(data: NewNotice): Promise<Notice> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new AppError(AppErrorCode.VALIDATION, 'noActiveCrew')
    }

    const { data: row, error } = await supabase
      .from('notices')
      .insert({ crew_id: crewId, student_id: data.studentId, kind: data.kind, body: data.body })
      .select('*')
      .single()

    if (error) throw mapDataError(error)
    return toNotice(row as NoticeRow)
  }

  async markAllRead(studentId: string): Promise<void> {
    const { error } = await supabase
      .from('notices')
      .update({ read_at: new Date().toISOString() })
      .eq('student_id', studentId)
      .is('read_at', null)

    if (error) throw mapDataError(error)
  }

  /**
   * La campana es la primera pantalla que merece tiempo real (plan, §1.3), y
   * llega con la publicacion de `notices` habilitada. Hasta entonces, no avisar
   * es una implementacion valida del contrato.
   */
  onChange(): () => void {
    return () => undefined
  }
}
