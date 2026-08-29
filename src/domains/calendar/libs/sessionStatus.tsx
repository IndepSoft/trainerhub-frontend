import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SessionStatus } from '../types/calendar.types'

/**
 * Presentación de cada estado de sesión: etiqueta, colores e icono.
 *
 * Antes había dos `getStatusColor` distintos —uno en la página y otro en
 * `SessionDetailsModal`— con clases que **no coincidían**: la página añadía
 * `border-*` y el modal no. Dos fuentes de verdad para lo mismo, divergiendo en
 * silencio.
 *
 * Como `Record` sobre la unión, el compilador obliga a cubrir los tres estados,
 * asi que ya no hace falta la rama `default` que tenían los `switch`.
 */
interface SessionStatusPresentation {
  label: string
  /** Clases para la tarjeta en la rejilla, con borde. */
  slotClassName: string
  /** Clases para la insignia dentro del modal, sin borde. */
  badgeClassName: string
  icon: ReactNode
}

export const SESSION_STATUS: Record<SessionStatus, SessionStatusPresentation> = {
  confirmed: {
    label: 'Confirmada',
    slotClassName: 'bg-success-surface text-success border-success/30',
    badgeClassName: 'bg-success-surface text-success',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  pending: {
    label: 'Pendiente',
    slotClassName: 'bg-warning-surface text-warning border-warning/30',
    badgeClassName: 'bg-warning-surface text-warning',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  cancelled: {
    label: 'Cancelada',
    slotClassName: 'bg-danger-surface text-danger border-danger/30',
    badgeClassName: 'bg-danger-surface text-danger',
    icon: <XCircle className="w-3 h-3" />,
  },
}

/**
 * Los estados como pares, para poblar desplegables sin repetir las etiquetas.
 * `Object.entries` pierde el tipo de la clave, asi que se reafirma aqui una sola
 * vez en lugar de en cada consumidor.
 */
export const SESSION_STATUS_ENTRIES = Object.entries(SESSION_STATUS) as [
  SessionStatus,
  (typeof SESSION_STATUS)[SessionStatus],
][]
