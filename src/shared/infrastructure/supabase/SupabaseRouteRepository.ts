import type { MilestoneValidationInput, RouteRepository } from '@/shared/domain/ports/RouteRepository'
import type { PendingMilestone, ProgressRouteCode, RouteProgress } from '@/shared/domain/entities/progress'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import {
  toPendingMilestone,
  toRouteProgress,
  type PendingMilestoneRow,
  type RouteProgressRow,
} from './mappers'
import { subscribeToTables } from './realtime'

/**
 * Implementacion de RouteRepository sobre las funciones de `rutas_y_entrenador`.
 *
 * Todo son funciones y no tablas: leer es `route_progress`, que calcula el
 * nodo al vuelo -un nodo guardado se desincroniza al primer cambio-; escribir
 * es `choose_route` y `validate_milestone`, que comprueban `students.manage`.
 */
export class SupabaseRouteRepository implements RouteRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async progressOf(studentId: string): Promise<RouteProgress> {
    const { data, error } = await supabase.rpc('route_progress', { student: studentId })

    if (error) throw mapDataError(error)
    const rows = (data ?? []) as RouteProgressRow[]
    if (rows.length === 0) {
      throw new AppError(AppErrorCode.NOT_FOUND, 'notFound')
    }
    return toRouteProgress(studentId, rows[0])
  }

  async choose(studentId: string, route: ProgressRouteCode): Promise<void> {
    const { error } = await supabase.rpc('choose_route', { student: studentId, route })
    if (error) throw mapDataError(error)
  }

  async validateMilestone(input: MilestoneValidationInput): Promise<void> {
    const { error } = await supabase.rpc('validate_milestone', {
      student: input.studentId,
      route: input.route,
      node: input.position,
      validation_notes: input.notes,
    })
    if (error) throw mapDataError(error)
  }

  async pendingMilestones(): Promise<PendingMilestone[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase.rpc('crew_pending_milestones', { crew: crewId })

    if (error) throw mapDataError(error)
    return ((data ?? []) as PendingMilestoneRow[]).map(toPendingMilestone)
  }

  // Lo que mueve una ruta: elegirla, validar un hito, y cada sesion puntuada.
  onChange(listener: () => void): () => void {
    return subscribeToTables(['student_routes', 'milestone_validations', 'session_scores'], listener)
  }
}
