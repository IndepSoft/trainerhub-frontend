import { addDays, toLocalDateKey } from '../libs/calendar.utils'
import type { Session } from '../types/calendar.types'

/**
 * Sesiones simuladas de la agenda.
 *
 * Estaban en el cuerpo de `Calendar.tsx`, junto a la disposición de la página.
 *
 * Las fechas se calculan **relativas a hoy** en vez de estar fijadas al
 * 15 y 16 de enero de 2024, como estaban antes. Con fechas de 2024 la agenda
 * salía siempre vacía, asi que no habia forma de ver si la vista funcionaba sin
 * navegar dos años atrás.
 *
 * TODO: sustituir por un `SessionRepository` -puerto en `shared/domain/ports`,
 * adaptador en `shared/infrastructure`- cuando exista el esquema. `useCalendar`
 * es el único punto que habrá que tocar.
 */
const today = new Date()
const TODAY = toLocalDateKey(today)
const TOMORROW = toLocalDateKey(addDays(today, 1))

export const sessionsMock: Session[] = [
  {
    id: 'session-1',
    title: 'Entrenamiento Personal - María García',
    student: 'María García',
    kind: 'individual',
    category: 'Entrenamiento Personal',
    date: TODAY,
    time: '09:00',
    durationMinutes: 60,
    location: 'Gimnasio Principal',
    status: 'confirmed',
    notes: 'Enfoque en tren superior',
    routineId: 'routine-2',
  },
  {
    id: 'session-2',
    title: 'Evaluación Inicial - Carlos López',
    student: 'Carlos López',
    kind: 'individual',
    category: 'Evaluación',
    date: TODAY,
    time: '10:30',
    durationMinutes: 45,
    location: 'Sala de Evaluación',
    status: 'pending',
    notes: 'Primera sesión, mediciones corporales',
    routineId: null,
  },
  {
    id: 'session-3',
    title: 'Clase Grupal - HIIT',
    student: 'Grupo HIIT',
    kind: 'group',
    category: 'Entrenamiento Grupal',
    date: TODAY,
    time: '18:00',
    durationMinutes: 45,
    location: 'Sala Grupal',
    status: 'confirmed',
    notes: 'Máximo 8 personas',
    routineId: null,
  },
  {
    id: 'session-4',
    title: 'Seguimiento - Ana Martínez',
    student: 'Ana Martínez',
    kind: 'individual',
    category: 'Seguimiento',
    date: TOMORROW,
    time: '14:00',
    durationMinutes: 30,
    location: 'Oficina',
    status: 'confirmed',
    notes: 'Revisión de progreso mensual',
    routineId: null,
  },
  {
    id: 'session-5',
    title: 'Entrenamiento Personal - Pedro Rodríguez',
    student: 'Pedro Rodríguez',
    kind: 'individual',
    category: 'Entrenamiento Personal',
    date: TOMORROW,
    time: '16:30',
    durationMinutes: 60,
    location: 'Gimnasio Principal',
    status: 'cancelled',
    notes: 'Cancelado por el cliente',
    routineId: null,
  },
]
