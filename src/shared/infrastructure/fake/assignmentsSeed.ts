import type { Assignment } from '@/shared/domain/entities/assignment'

/**
 * Asignaciones simuladas.
 *
 * Dos casos a proposito, para que la ficha muestre los dos estados que admite un
 * plan: uno anclado en el tiempo y otro asignado sin fecha de inicio, que es un
 * estado legitimo -«este es tu programa, ya veremos cuando empiezas»-.
 *
 * TODO: sustituir por el adaptador real cuando exista el esquema.
 */
export const assignmentsSeed: Assignment[] = [
  {
    id: 'assignment-1',
    studentId: 'student-2',
    kind: 'plan',
    planId: 'plan-1',
    assignedOn: '2026-08-24',
    startDate: '2026-09-07',
    notes: 'Empieza tras la semana de vacaciones.',
  },
  {
    id: 'assignment-2',
    studentId: 'student-2',
    kind: 'routine',
    routineId: 'routine-2',
    assignedOn: '2026-08-28',
    notes: 'Para los dias que venga suelto.',
  },
  {
    id: 'assignment-3',
    studentId: 'student-3',
    kind: 'plan',
    planId: 'plan-1',
    assignedOn: '2026-08-30',
    startDate: null,
    notes: '',
  },
]
