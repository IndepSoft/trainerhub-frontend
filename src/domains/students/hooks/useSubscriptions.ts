import { useCallback, useMemo, useState } from 'react'
import { container } from '@/app/container'
import { crewScope } from '@/app/crewScope'
import { useCachedQuery } from '@/shared/hooks/useCachedQuery'
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
  /**
   * Cobra un periodo: mueve la fecha pagada hacia delante.
   *
   * `paidOn` es el día en que se recibió el dinero, que no siempre es hoy —se
   * cobra el lunes y se registra el miércoles—. Por defecto, hoy.
   */
  renew: (studentId: string, crewId: string, paidOn?: string) => Promise<void>
  /** Cambia cada cuánto paga, sin cobrar nada. */
  setPeriod: (studentId: string, crewId: string, periodDays: number) => Promise<void>
}

/** Referencia estable para el «todavía nada». */
const NONE: StudentSubscription[] = []

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
  const [today] = useState(() => toLocalDateKey(new Date()))

  /*
   * Se guarda la LISTA y no el mapa: la caché conserva lo que el puerto
   * devuelve, y armar el índice es cosa de quien lo va a consultar. Guardar el
   * mapa obligaría a la caché a saber cómo se indexa cada dominio.
   */
  const { data: subscriptions, loading } = useCachedQuery<StudentSubscription[]>({
    key: ['subscriptions', crewScope.current()],
    load: () => container.subscriptions.findAll(),
    subscribe: (reload) => container.subscriptions.onChange(reload),
    initial: NONE,
    errorKey: 'students.loadError',
  })

  const byStudent = useMemo(
    () => new Map(subscriptions.map((entry) => [entry.studentId, entry])),
    [subscriptions]
  )

  const standingOf = useCallback(
    (studentId: string) => subscriptionStanding(byStudent.get(studentId), today),
    [byStudent, today]
  )

  const renew = useCallback(
    async (studentId: string, crewId: string, paidOn: string = today) => {
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
        paidThrough: renewedThrough(current, paidOn),
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
