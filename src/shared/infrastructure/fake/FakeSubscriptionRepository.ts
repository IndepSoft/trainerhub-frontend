import type { SubscriptionRepository } from '@/shared/domain/ports/SubscriptionRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { StudentSubscription } from '@/shared/domain/entities/studentSubscription'
import { subscriptionsSeed } from './subscriptionsSeed'

/**
 * Cuotas simuladas mientras no hay backend.
 *
 * TODO: los datos viven solo en memoria. Al recargar vuelve la semilla.
 */
export class FakeSubscriptionRepository implements SubscriptionRepository {
  private subscriptions: StudentSubscription[] = subscriptionsSeed
  private readonly listeners = new Set<() => void>()
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<StudentSubscription[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []
    return this.subscriptions.filter((entry) => entry.crewId === crewId)
  }

  async save(subscription: StudentSubscription): Promise<void> {
    // Una sola clave por alumno y crew: cobrar dos veces no crea dos cuotas,
    // mueve la fecha de la que hay.
    const exists = this.subscriptions.some(
      (entry) =>
        entry.studentId === subscription.studentId && entry.crewId === subscription.crewId
    )

    this.subscriptions = exists
      ? this.subscriptions.map((entry) =>
          entry.studentId === subscription.studentId && entry.crewId === subscription.crewId
            ? subscription
            : entry
        )
      : [...this.subscriptions, subscription]

    this.notify()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
