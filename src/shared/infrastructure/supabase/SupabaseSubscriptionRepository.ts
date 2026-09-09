import type { SubscriptionRepository } from '@/shared/domain/ports/SubscriptionRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { StudentSubscription } from '@/shared/domain/entities/studentSubscription'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toSubscription, toSubscriptionRow, type SubscriptionRow } from './mappers'
import { subscribeToTable } from './realtime'

/**
 * Implementacion de SubscriptionRepository sobre PostgREST.
 *
 * `save` es un `upsert` por alumno: «este alumno paga cada tanto y tiene hasta
 * tal dia» es una sola decision, y que exista ya una fila o no es cosa del
 * almacen, no de quien la toma. Es lo que el puerto deja escrito.
 */
export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<StudentSubscription[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase
      .from('student_subscriptions')
      .select('*')
      .eq('crew_id', crewId)

    if (error) throw mapDataError(error)
    return ((data ?? []) as SubscriptionRow[]).map(toSubscription)
  }

  async save(subscription: StudentSubscription): Promise<void> {
    const { error } = await supabase
      .from('student_subscriptions')
      .upsert({ ...toSubscriptionRow(subscription), updated_at: new Date().toISOString() })

    if (error) throw mapDataError(error)
  }

  /**
   * La cuota la marca quien lleva las altas y la mira el alumno en su ficha:
   * dos personas distintas en dos pantallas distintas.
   */
  onChange(listener: () => void): () => void {
    return subscribeToTable('student_subscriptions', listener)
  }
}
