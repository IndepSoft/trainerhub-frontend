import { AlertCircle, CheckCircle, CircleCheckBig, CircleDashed, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Session, SessionStatus } from '../types/calendar.types'
import { isMissedSession } from '@/shared/domain/sessionLifecycle'
import { SESSION_STATUS_LABEL_KEY } from '@/shared/i18n/domainLabels'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

/**
 * Presentación de cada estado de sesión: etiqueta, colores e icono.
 *
 * Antes había dos `getStatusColor` distintos —uno en la página y otro en
 * `SessionDetailsModal`— con clases que **no coincidían**: la página añadía
 * `border-*` y el modal no. Dos fuentes de verdad para lo mismo, divergiendo en
 * silencio.
 *
 * Como `Record` sobre la unión, el compilador obliga a cubrir TODOS los estados,
 * asi que ya no hace falta la rama `default` que tenían los `switch`. Al añadir
 * `completed` fue el compilador quien señaló los cuatro sitios que faltaban por
 * cubrir, que es exactamente para lo que sirve escribirlo así.
 */
interface SessionStatusPresentation {
  /* La CLAVE del rotulo: esta tabla se evalua al importar, sin idioma todavia. */
  labelKey: TranslationKey
  /** Clases para la celda de la rejilla semanal, que es diminuta y necesita relleno. */
  slotClassName: string
  /** Clases para la insignia dentro del modal, sin borde. */
  badgeClassName: string
  /**
   * Insignia de contorno, como las de nivel en `students`.
   *
   * En una tarjeta blanca, un bloque de color sólido compite con el título. El
   * contorno da el estado sin robarle peso.
   */
  outlineBadgeClassName: string
  /**
   * Color de la cuña diagonal de la tarjeta.
   *
   * Es la pieza que conserva la lectura de un vistazo. Al pasar el bloque de
   * sesión a fondo blanco se perdía el «verde = confirmada» que se leía sin
   * mirar el texto; la cuña lo devuelve sin volver a teñir la tarjeta entera.
   */
  accentClassName: string
  icon: ReactNode
}

export const SESSION_STATUS: Record<SessionStatus, SessionStatusPresentation> = {
  pending: {
    labelKey: SESSION_STATUS_LABEL_KEY.pending,
    slotClassName: 'bg-warning-surface text-warning border-warning/30',
    badgeClassName: 'bg-warning-surface text-warning',
    outlineBadgeClassName: 'border-warning/45 text-warning',
    accentClassName: 'bg-warning/28',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  confirmed: {
    labelKey: SESSION_STATUS_LABEL_KEY.confirmed,
    slotClassName: 'bg-success-surface text-success border-success/30',
    badgeClassName: 'bg-success-surface text-success',
    outlineBadgeClassName: 'border-success/45 text-success',
    accentClassName: 'bg-success/25',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  completed: {
    labelKey: SESSION_STATUS_LABEL_KEY.completed,
    // Cobalto y no verde: el verde ya dice «confirmada», y una sesión hecha y
    // una sesión que se va a hacer no pueden leerse igual de un vistazo.
    slotClassName: 'bg-cobalt-tint text-cobalt border-cobalt/30',
    badgeClassName: 'bg-cobalt-tint text-cobalt',
    outlineBadgeClassName: 'border-cobalt/45 text-cobalt',
    accentClassName: 'bg-cobalt/25',
    icon: <CircleCheckBig className="w-3 h-3" />,
  },
  cancelled: {
    labelKey: SESSION_STATUS_LABEL_KEY.cancelled,
    slotClassName: 'bg-danger-surface text-danger border-danger/30',
    badgeClassName: 'bg-danger-surface text-danger',
    outlineBadgeClassName: 'border-danger/45 text-danger',
    accentClassName: 'bg-danger/22',
    icon: <XCircle className="w-3 h-3" />,
  },
}

/**
 * Los estados como pares, para poblar desplegables sin repetir las etiquetas.
 *
 * El orden del objeto de arriba es el del CICLO DE VIDA -pendiente, confirmada,
 * completada, cancelada- y no alfabetico ni historico, porque es el orden en que
 * se leen en un desplegable.
 * `Object.entries` pierde el tipo de la clave, asi que se reafirma aqui una sola
 * vez en lugar de en cada consumidor.
 */
export const SESSION_STATUS_ENTRIES = Object.entries(SESSION_STATUS) as [
  SessionStatus,
  (typeof SESSION_STATUS)[SessionStatus],
][]

/**
 * «No ocurrio»: una sesion abierta cuyo dia paso. NO es un estado guardado
 * -ver `sessionLifecycle`- y por eso no esta en `SESSION_STATUS`: nadie puede
 * elegirlo en un desplegable. Se pinta apagada, ni pendiente ni cancelada,
 * porque no es ninguna de las dos: es lo que hay que resolver.
 */
export const MISSED_SESSION: SessionStatusPresentation = {
  labelKey: 'session.status.missed',
  slotClassName: 'bg-cobalt-tint-1 text-ink/50 border-cobalt-tint-3 border-dashed',
  badgeClassName: 'bg-cobalt-tint-1 text-ink/55',
  outlineBadgeClassName: 'border-ink/25 text-ink/50 border-dashed',
  accentClassName: 'bg-ink/10',
  icon: <CircleDashed className="w-3 h-3" />,
}

export type SessionPresentationState = SessionStatus | 'missed'

/** La presentacion que le toca a una sesion hoy: su estado, o «no ocurrio». */
export function presentationOf(session: Session, todayKey: string): SessionStatusPresentation {
  return isMissedSession(session, todayKey) ? MISSED_SESSION : SESSION_STATUS[session.status]
}

/** El estado con el que se cuenta y se pinta, «no ocurrio» incluido. */
export function presentationStateOf(session: Session, todayKey: string): SessionPresentationState {
  return isMissedSession(session, todayKey) ? 'missed' : session.status
}
