import type { SessionStatus } from '@/shared/domain/entities/session'

/**
 * Entidades de la agenda.
 *
 * `Session` estaba declarada dos veces: una a mano dentro de
 * `SessionDetailsModal` y otra inferida en la página con
 * `(typeof sessions)[0]`, o sea derivada de los datos simulados. Las dos podían
 * divergir sin que nadie se enterara, y la segunda ataba el tipo de la
 * aplicación a la forma de unos mocks.
 */

/**
 * LA SESIÓN YA NO VIVE AQUÍ. Subió a `shared/domain/entities/session.ts` cuando
 * la ficha del estudiante paso a listar y agendar las suyas: la necesitan dos
 * dominios, y el criterio del proyecto es que entonces sube. Se reexporta para
 * que el dominio siga teniendo un solo sitio donde mirar sus tipos.
 */
export type { Session, SessionKind, SessionStatus } from '@/shared/domain/entities/session'

export type CalendarViewMode = 'week' | 'day'

/**
 * Cómo se dibuja un día.
 *
 * `list` es lo que se ve al entrar y `schedule` la rejilla de horas de siempre:
 * la rejilla sitúa una sesión en su tramo —útil para ver dónde cabe otra—, la
 * lista enseña el día entero sin desplazarse. Ver `dayAgenda`.
 */
export type DayLayout = 'list' | 'schedule'

/**
 * Lo que la ficha de una sesión puede cambiar sin abrir el formulario entero.
 *
 * Vivía en `SessionDetailsModal`, pero lo necesita también el hook que lo
 * escribe, y un hook no importa de un componente.
 */
export interface SessionDetailsChanges {
  status: SessionStatus
  notes: string
}
