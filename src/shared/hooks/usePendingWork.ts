import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { subscriptionStanding } from '@/shared/domain/subscriptionRules'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import type { Student } from '@/shared/domain/entities/student'
import type { PendingMilestone, SessionScore, StudentBadge } from '@/shared/domain/entities/progress'

/** Lo que espera una decisión de quien gestiona, agrupado por clase. */
export interface PendingWork {
  /** Solicitudes de entrada sin responder. */
  requests: Student[]
  /** Hitos que ya cumplen puntos y semanas y sólo esperan la validación. */
  milestones: PendingMilestone[]
  /** Insignias de Platino y Diamante por confirmar. */
  badges: StudentBadge[]
  /** Sesiones marcadas por salto de carga y sin revisar. */
  flagged: SessionScore[]
  /** Alumnos con la cuota vencida. */
  overdue: Student[]
  /** Fichas sin cuenta detrás: no ven su progreso ni reciben avisos. */
  noAccount: Student[]
  /** El padrón, para poner nombre a lo que llega por identificador. */
  students: Student[]
  /** La suma de todo lo anterior. Es el número de la barra. */
  total: number
  loading: boolean
}

const EMPTY: PendingWork = {
  requests: [],
  milestones: [],
  badges: [],
  flagged: [],
  overdue: [],
  noAccount: [],
  students: [],
  total: 0,
  loading: true,
}

/**
 * La bandeja del entrenador: todo lo que espera una decisión suya, en una
 * sola pregunta.
 *
 * NO EXISTÍA. Había nueve clases de trabajo pendiente —solicitudes, hitos,
 * insignias, cargas, cuotas, fichas sin cuenta— y cada una vivía en su
 * pantalla sin señal fuera de ella: con veinte alumnos, saber si alguien
 * esperaba una validación eran veinte fichas abiertas. Los puertos ya
 * respondían casi todas las preguntas por alumno; lo que faltaba era la
 * vista que las junta, y dos consultas por equipo (`pendingMilestones`,
 * `flaggedOfCrew`).
 *
 * Vive en `shared` porque la pinta el panel y la cuenta la barra de
 * navegación, que es de `shared` y no puede importar de un dominio. Sólo
 * pregunta a los puertos y a funciones puras del dominio.
 *
 * `enabled` a `false` para quien no gestiona: un alumno no tiene bandeja, y
 * preguntar por el equipo desde su ámbito devolvería vacío tras seis viajes.
 */
export function usePendingWork(enabled: boolean): PendingWork {
  const [work, setWork] = useState<PendingWork>(EMPTY)

  const load = useCallback(async (): Promise<void> => {
    if (!enabled) {
      setWork({ ...EMPTY, loading: false })
      return
    }

    // En paralelo: son seis lecturas independientes.
    const [requests, students, badges, flagged, milestones, subscriptions] = await Promise.all([
      container.students.findRequests(),
      container.students.findAll(),
      container.badges.pendingValidation(),
      container.scores.flaggedOfCrew(),
      container.routes.pendingMilestones(),
      container.subscriptions.findAll(),
    ])

    const today = toLocalDateKey(new Date())
    const byStudent = new Map(subscriptions.map((entry) => [entry.studentId, entry]))
    const overdue = students.filter(
      (student) => subscriptionStanding(byStudent.get(student.id), today).state === 'overdue'
    )
    const noAccount = students.filter((student) => student.profileId === null)

    setWork({
      requests,
      milestones,
      badges,
      flagged,
      overdue,
      noAccount,
      students,
      total:
        requests.length +
        milestones.length +
        badges.length +
        flagged.length +
        overdue.length +
        noAccount.length,
      loading: false,
    })
  }, [enabled])

  useEffect(() => {
    // Un fallo de red deja la bandeja como estaba: es un resumen, no una
    // pantalla, y el error se enseña donde se actúa.
    const reload = () => void load().catch(() => undefined)
    reload()

    // Todo lo que puede mover la bandeja, suscrito: aceptar a alguien, cerrar
    // una sesión, cobrar, validar.
    const unsubscribes = [
      container.students.onChange(reload),
      container.badges.onChange(reload),
      container.scores.onChange(reload),
      container.routes.onChange(reload),
      container.subscriptions.onChange(reload),
    ]

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [load])

  return work
}
