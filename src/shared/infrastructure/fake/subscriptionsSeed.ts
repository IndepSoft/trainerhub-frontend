import type { StudentSubscription } from '@/shared/domain/entities/studentSubscription'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import { DEV_CREW_ID } from './crewsSeed'

/** Una fecha relativa a hoy, en clave local. Nada de `toISOString`. */
function inDays(days: number): string {
  const today = new Date()
  return toLocalDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days))
}

/**
 * Cuotas simuladas.
 *
 * CADA UNA CUBRE UN ESTADO, porque la cola de cobros se juzga por como reparte
 * los casos y con todos al dia no se veria nada:
 *
 *  - Juan vencio hace cinco dias: es el que hay que llamar hoy.
 *  - Maria vence en tres: entra en «vence pronto», que existe para dar margen.
 *  - Carlos va holgado, con un bono trimestral: el periodo VARIA, no siempre son
 *    treinta dias.
 *  - Ana no tiene cuota: es alta reciente y todavia no ha pagado, que no es lo
 *    mismo que deber.
 *
 * TODO: sustituir por el adaptador real cuando exista el esquema.
 */
export const subscriptionsSeed: StudentSubscription[] = [
  { studentId: 'student-1', crewId: DEV_CREW_ID, periodDays: 30, paidThrough: inDays(-5) },
  { studentId: 'student-2', crewId: DEV_CREW_ID, periodDays: 30, paidThrough: inDays(3) },
  { studentId: 'student-3', crewId: DEV_CREW_ID, periodDays: 90, paidThrough: inDays(54) },
]
