import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import {
  DEFAULT_PERIOD_DAYS,
  type StudentSubscription,
} from '@/shared/domain/entities/studentSubscription'
import { renewedThrough, subscriptionStanding } from '@/shared/domain/subscriptionRules'
import type { SubscriptionStanding } from '@/shared/domain/entities/studentSubscription'

interface UseSubscriptionsResult {
  /** Por identificador de alumno. Sin entrada = no tiene cuota registrada. */
  byStudent: Map<string, StudentSubscription>
  /** El día de hoy, resuelto una vez para toda la pantalla. */
  today: string
  loading: boolean
  standingOf: (studentId: string) => SubscriptionStanding
  /** Cobra un periodo: mueve la fecha pagada hacia delante. */
  renew: (studentId: string, crewId: string) => Promise<void>
  /** Cambia cada cuánto paga, sin cobrar nada. */
  setPeriod: (studentId: string, crewId: string, periodDays: number) => Promise<void>
}

/**
 * Las cuotas del crew activo.
 *
 * `today` SE RESUELVE UNA VEZ y viaja con el resultado. Si cada fila preguntara
 * qué día es por su cuenta, una lista abierta a las 23:59 mezclaría dos días y
 * la misma cuota saldría vencida en una fila y al día en otra.
 *
 * Todo lo demás son las reglas de `subscriptionRules`, que están en el dominio
 * porque las preguntan la ficha, la cola de cobros y el aviso.
 */
export function useSubscriptions(): UseSubscriptionsResult {
  const [byStudent, setByStudent] = useState<Map<string, StudentSubscription>>(new Map())
  const [today] = useState(() => toLocalDateKey(new Date()))
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    const found = await container.subscriptions.findAll()
    setByStudent(new Map(found.map((entry) => [entry.studentId, entry])))
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    return container.subscriptions.onChange(() => {
      void load()
    })
  }, [load])

  const standingOf = useCallback(
    (studentId: string) => subscriptionStanding(byStudent.get(studentId), today),
    [byStudent, today]
  )

  const renew = useCallback(
    async (studentId: string, crewId: string) => {
      /*
       * Sin cuota previa se crea una desde hoy. `renewedThrough` necesita algo
       * de lo que partir, y el alta de un alumno no crea su cuota: puede
       * entrenar antes de pagar, y a la inversa.
       */
      const current: StudentSubscription = byStudent.get(studentId) ?? {
        studentId,
        crewId,
        periodDays: DEFAULT_PERIOD_DAYS,
        paidThrough: null,
      }

      await container.subscriptions.save({
        ...current,
        paidThrough: renewedThrough(current, today),
      })
    },
    [byStudent, today]
  )

  const setPeriod = useCallback(
    async (studentId: string, crewId: string, periodDays: number) => {
      const current = byStudent.get(studentId)

      // Cambiar el periodo NO cobra: sólo dice cada cuánto se cobrará a partir
      // de ahora. La fecha pagada se conserva.
      await container.subscriptions.save({
        studentId,
        crewId,
        periodDays,
        paidThrough: current?.paidThrough ?? null,
      })
    },
    [byStudent]
  )

  return { byStudent, today, loading, standingOf, renew, setPeriod }
}
