import { useSubscriptions } from '@/domains/students/hooks/useSubscriptions'
import { useStudents } from '@/domains/students/hooks/useStudents'
import type { SubscriptionStanding } from '@/shared/domain/entities/studentSubscription'
import type { Student } from '@/shared/domain/entities/student'

export interface DuesEntry {
  student: Student
  standing: SubscriptionStanding
  /** Hasta qué día tiene pagado, o `null`. */
  paidThrough: string | null
}

interface UseDuesQueueResult {
  /** En cola: lo vencido primero, después lo que vence antes. */
  queue: DuesEntry[]
  overdueCount: number
  dueSoonCount: number
  loading: boolean
}

/**
 * La cola de cobros del crew: quién vence y cuándo.
 *
 * EL ORDEN ES LA FUNCIÓN. Una lista de cuotas por orden alfabético no sirve de
 * nada: lo que se viene a hacer aquí es empezar por arriba y llamar. Lo vencido
 * primero —es dinero que ya se debía— y dentro de cada grupo, lo que vence
 * antes.
 *
 * QUIEN NO TIENE CUOTA VA AL FINAL, no al principio. No debe nada: es un alta
 * reciente a la que todavía no se le ha puesto tarifa, y mezclarla con los
 * morosos haría que la lista dejara de leerse de arriba abajo.
 */
export function useDuesQueue(): UseDuesQueueResult {
  const { students, loading: loadingStudents } = useStudents()
  const { byStudent, standingOf, loading: loadingSubscriptions } = useSubscriptions()

  const entries: DuesEntry[] = students.map((student) => ({
    student,
    standing: standingOf(student.id),
    paidThrough: byStudent.get(student.id)?.paidThrough ?? null,
  }))

  const queue = [...entries].sort((left, right) => {
    // Sin cuota al final, sea cual sea el otro.
    if (left.standing.daysLeft === null) return right.standing.daysLeft === null ? 0 : 1
    if (right.standing.daysLeft === null) return -1

    return left.standing.daysLeft - right.standing.daysLeft
  })

  return {
    queue,
    overdueCount: entries.filter((entry) => entry.standing.state === 'overdue').length,
    dueSoonCount: entries.filter((entry) => entry.standing.state === 'dueSoon').length,
    loading: loadingStudents || loadingSubscriptions,
  }
}
