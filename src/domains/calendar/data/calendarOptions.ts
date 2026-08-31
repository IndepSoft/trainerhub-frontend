/**
 * Opciones fijas de la agenda.
 *
 * Los tramos y las ubicaciones SUBIERON a `shared/domain/entities/session.ts`
 * cuando la ficha del estudiante paso a agendar tambien: son vocabulario de la
 * sesion, no de esta vista. Se reexportan con el nombre que ya usaba el dominio.
 */
export { SESSION_LOCATIONS } from '@/shared/domain/entities/session'
export { SESSION_TIME_SLOTS as TIME_SLOTS } from '@/shared/domain/entities/session'

export const WEEK_DAY_LABELS: string[] = [
  'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom',
]
