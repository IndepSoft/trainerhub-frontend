import type { AssignmentRepository } from '@/shared/domain/ports/AssignmentRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { Assignment, NewAssignment } from '@/shared/domain/entities/assignment'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toAssignment, toAssignmentRow, type AssignmentRow } from './mappers'

/** Implementacion de AssignmentRepository sobre PostgREST. */
export class SupabaseAssignmentRepository implements AssignmentRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findByStudent(studentId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('student_id', studentId)
      .order('assigned_on', { ascending: false })

    if (error) throw mapDataError(error)
    return ((data ?? []) as AssignmentRow[]).map(toAssignment)
  }

  async create(data: NewAssignment): Promise<Assignment> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new AppError(AppErrorCode.VALIDATION, 'noActiveCrew')
    }

    const { data: row, error } = await supabase
      .from('assignments')
      .insert({ crew_id: crewId, ...toAssignmentRow(data) })
      .select('*')
      .single()

    if (error) throw mapDataError(error)
    return toAssignment(row as AssignmentRow)
  }

  async remove(assignmentId: string): Promise<void> {
    const { error } = await supabase.from('assignments').delete().eq('id', assignmentId)

    if (error) throw mapDataError(error)
  }

  /** TODO: sin suscripcion todavia. Ver el plan, §1.3. */
  onChange(): () => void {
    return () => undefined
  }
}
