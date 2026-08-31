import type { Session } from '@/shared/domain/entities/session'

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
 * Los alumnos se referencian por IDENTIFICADOR. Antes se guardaba su nombre en
 * texto, y el dato ya estaba corrompido: aqui ponia «María García» y «Ana
 * Martínez» cuando en `studentsSeed` estan «María Gómez» y «Ana Torres». Nadie
 * lo noto porque nada obligaba a que coincidieran.
 *
 * TODO: sustituir por el adaptador real cuando exista el esquema.
 */
/**
 * Clave de fecha local, `YYYY-MM-DD`.
 *
 * Se calcula aqui y no con `toLocalDateKey` del calendario: la infraestructura
 * compartida no puede importar de un dominio. Son tres lineas y evitan que la
 * semilla ate `shared` a `calendar`.
 */
function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = new Date()
const TODAY = toDateKey(today)
const TOMORROW = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))

export const sessionsSeed: Session[] = [
  {
    id: 'session-1',
    title: 'Entrenamiento Personal',
    studentId: 'student-2',
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
    title: 'Evaluación Inicial',
    studentId: 'student-3',
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
    title: 'Clase Grupal',
    studentId: null,
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
    title: 'Seguimiento',
    studentId: 'student-4',
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
    title: 'Entrenamiento Personal',
    studentId: 'student-1',
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
