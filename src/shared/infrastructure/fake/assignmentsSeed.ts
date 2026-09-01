import type { Assignment } from '@/shared/domain/entities/assignment'

/**
 * Asignaciones simuladas.
 *
 * LAS FECHAS SE CALCULAN RELATIVAS A HOY, no escritas a mano. Estaban fijadas al
 * 7 de septiembre de 2026 y eso caduca solo: en cuanto esa fecha queda atras, el
 * plan aparece «empezando» en el pasado y volcarlo genera sesiones vencidas. Es
 * el mismo defecto que ya tuvo la semilla del calendario, que estaba clavada en
 * enero de 2024 y dejaba la agenda siempre vacia.
 *
 * Dos casos a proposito, para que la ficha muestre los dos estados que admite un
 * plan: uno anclado en el tiempo y otro asignado sin fecha de inicio, que es un
 * estado legitimo -«este es tu programa, ya veremos cuando empiezas»-.
 *
 * TODO: sustituir por el adaptador real cuando exista el esquema.
 */

/** Clave de fecha local, `YYYY-MM-DD`. Nada de `toISOString`: desplaza el dia. */
function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

const today = new Date()

/**
 * El proximo lunes, y nunca hoy.
 *
 * Un plan empieza en lunes porque su semana va de lunes a domingo, y arrancar
 * siempre en el futuro evita que la semilla nazca con sesiones vencidas.
 */
const NEXT_MONDAY = toDateKey(addDays(today, ((8 - (today.getDay() || 7)) % 7) || 7))

const A_WEEK_AGO = toDateKey(addDays(today, -7))
const THREE_DAYS_AGO = toDateKey(addDays(today, -3))

export const assignmentsSeed: Assignment[] = [
  {
    id: 'assignment-1',
    studentId: 'student-2',
    kind: 'plan',
    planId: 'plan-1',
    assignedOn: A_WEEK_AGO,
    startDate: NEXT_MONDAY,
    notes: 'Empieza tras la semana de vacaciones.',
  },
  {
    id: 'assignment-2',
    studentId: 'student-2',
    kind: 'routine',
    routineId: 'routine-2',
    assignedOn: THREE_DAYS_AGO,
    notes: 'Para los dias que venga suelto.',
  },
  {
    id: 'assignment-3',
    studentId: 'student-3',
    kind: 'plan',
    planId: 'plan-1',
    assignedOn: THREE_DAYS_AGO,
    startDate: null,
    notes: '',
  },
]
