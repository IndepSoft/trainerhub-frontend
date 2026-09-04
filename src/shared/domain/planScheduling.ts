import type { Routine } from './entities/routine'
import type { NewSession } from './ports/SessionRepository'
import type { Session } from './entities/session'
import type { TrainingPlan } from './entities/plan'
import { estimateRoutineMinutes } from './routineMetrics'
import { findOverlappingSessions } from './sessionScheduling'

/**
 * Volcar un plan a la agenda: convertir un patrón semanal en sesiones con fecha.
 * Funciones puras, sin React.
 *
 * ES DONDE EL PLAN GANA LAS TRES COSAS QUE NO TIENE. Un plan dice «lunes», no
 * «lunes 8 de septiembre»: le falta desde cuándo, a qué hora y para quién. La
 * asignación aporta las dos primeras y el alumno; esto produce el resultado.
 *
 * Las sesiones se MATERIALIZAN, no se derivan. Guardar sólo la asignación y
 * calcular la agenda al pintarla sería más compacto y haría imposible lo más
 * corriente: mover una sesión porque el alumno no puede ese martes, cancelar
 * otra, ponerle una nota. Cada una de esas cosas exigiría un mecanismo de
 * excepciones sobre la regla, que es el problema clásico de los calendarios
 * recurrentes.
 *
 * Y la propagación queda repartida como debe: la sesión guarda `routineId` por
 * REFERENCIA —corregir los ejercicios de la rutina alcanza a las sesiones
 * futuras— y el horario COPIADO —reorganizar el plan no mueve retroactivamente
 * lo ya agendado—.
 */

/** Hora de comienzo para cada día de la semana, `1` = lunes … `7` = domingo. */
export type TimesByWeekday = Record<number, string>

export interface PlanScheduleInput {
  plan: TrainingPlan
  studentId: string
  /** Desde cuándo cuenta la semana 1. Fecha local `YYYY-MM-DD`. */
  startDate: string
  timesByWeekday: TimesByWeekday
  location: string
  /** Para estimar cuánto ocupa cada sesión. */
  routinesById: Map<string, Routine>
}

/** Una sesión generada, con lo que choque en la agenda ya resuelto. */
export interface PlannedSession {
  session: NewSession
  /** Sesiones existentes con las que se solapa. Vacío si el hueco está libre. */
  conflicts: Session[]
}

/**
 * Los días de la semana que el plan usa, en orden.
 *
 * Es lo que decide cuántas horas hay que pedir: un full body de lunes, miércoles
 * y viernes pide tres, no siete. Preguntar por los siete obligaría a rellenar
 * cuatro campos para días de descanso.
 */
export function weekdaysUsedBy(plan: TrainingPlan): number[] {
  const used = new Set<number>()

  for (const week of plan.weeks) {
    for (const day of week.days) {
      if (day.routineId !== null) used.add(day.dayOfWeek)
    }
  }

  return [...used].sort((left, right) => left - right)
}

/** `2026-09-08` → `1` (lunes). Con la numeración del plan, no la de `Date`. */
function isoWeekday(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  // `getDay` devuelve 0 para domingo; el plan numera 1 = lunes … 7 = domingo.
  return ((new Date(year, month - 1, day).getDay() + 6) % 7) + 1
}

/**
 * Suma días a una clave de fecha.
 *
 * Se construye la fecha por partes y se deja que `Date` desborde el mes: nada de
 * `toISOString`, que convierte a UTC y desplaza al día anterior en husos
 * negativos.
 */
function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const result = new Date(year, month - 1, day + days)

  const resultYear = result.getFullYear()
  const resultMonth = String(result.getMonth() + 1).padStart(2, '0')
  const resultDay = String(result.getDate()).padStart(2, '0')
  return `${resultYear}-${resultMonth}-${resultDay}`
}

/**
 * Las sesiones que saldrían de volcar el plan, con sus choques.
 *
 * La semana 1 se ancla al LUNES de la semana que contiene `startDate`, y los
 * días anteriores a `startDate` se descartan. Así empezar un miércoles produce
 * una primera semana parcial —que es lo que de verdad pasa— en vez de agendar
 * hacia atrás o de correr el plan tres días.
 *
 * Un día sin rutina no genera nada: el descanso no ocupa hueco en la agenda.
 */
export function planSessions(
  input: PlanScheduleInput,
  existingSessions: Session[]
): PlannedSession[] {
  const mondayOfFirstWeek = addDays(input.startDate, -(isoWeekday(input.startDate) - 1))
  const planned: PlannedSession[] = []

  for (const week of input.plan.weeks) {
    for (const day of week.days) {
      if (day.routineId === null) continue

      const time = input.timesByWeekday[day.dayOfWeek]
      if (time === undefined) continue

      const date = addDays(mondayOfFirstWeek, (week.number - 1) * 7 + (day.dayOfWeek - 1))
      // Lo anterior al inicio no se agenda: el plan empieza cuando empieza.
      if (date < input.startDate) continue

      const routine = input.routinesById.get(day.routineId)
      const session: NewSession = {
        title: routine?.title ?? input.plan.title,
        studentId: input.studentId,
        kind: 'individual',
        // Un plan de mesociclo es entrenamiento de fuerza por definicion.
        modality: 'strength',
        category: input.plan.title,
        date,
        time,
        durationMinutes: routine === undefined ? 60 : estimateRoutineMinutes(routine),
        location: input.location,
        // Nace pendiente, como cualquier sesión recién creada: confirmarla es un
        // acto aparte.
        status: 'pending',
        notes: '',
        routineId: day.routineId,
        // Nace sin resultado: no ha ocurrido todavia.
        result: null,
      }

      planned.push({
        session,
        /*
         * Se comprueba contra la agenda existente y contra lo ya planificado en
         * esta misma tanda: un plan de dos sesiones el mismo día chocaría
         * consigo mismo, y no avisar de eso sería peor que no avisar de nada.
         */
        conflicts: findOverlappingSessions(
          [...existingSessions, ...planned.map((entry) => withTemporaryId(entry.session))],
          session
        ),
      })
    }
  }

  return planned
}

/**
 * Las generadas todavía no tienen identificador ni crew, y
 * `findOverlappingSessions` pide una `Session` entera. Se les prestan los dos:
 * ninguno sale de esta función, y la comprobación de solapes no los mira —el
 * choque se decide por fecha, hora y duración—.
 */
function withTemporaryId(session: NewSession): Session {
  return { id: 'planificada', crewId: 'planificada', ...session }
}

/** Cuántas de las planificadas chocan con algo. */
export function countConflicting(planned: PlannedSession[]): number {
  return planned.filter((entry) => entry.conflicts.length > 0).length
}
