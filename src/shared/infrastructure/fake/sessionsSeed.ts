import type { Session, SetRecord } from '@/shared/domain/entities/session'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import { DEV_CREW_ID } from './crewsSeed'
import { routinesSeed } from './routinesSeed'

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
const today = new Date()
const TODAY = toLocalDateKey(today)
const TOMORROW = toLocalDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))

function daysAgo(days: number): string {
  return toLocalDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - days))
}

/**
 * Historial ya entrenado de `student-1`.
 *
 * HACIA FALTA. Sin sesiones cerradas, Progreso no tiene racha que contar ni
 * nivel que calcular, y el panel enseña «aún no hay sesiones completadas» desde
 * el primer arranque: la aplicación se veía como si nadie hubiera entrenado
 * nunca. Y sin datos no hay forma de comprobar que las reglas de progreso
 * calculan lo que dicen calcular.
 *
 * LA FORMA IMPORTA, no sólo la cantidad. Siete días seguidos hasta ayer, un
 * hueco de dos, y tres días más antes: así el historial ejercita a la vez la
 * racha en curso, la racha máxima, un logro que se consigue —«Semana Perfecta»,
 * siete seguidos— y el corte que rompe una racha. Un historial sin agujeros no
 * probaría nunca el caso que de verdad importa.
 *
 * `completedSets` por debajo de `totalSets` en dos de ellas, porque también
 * ocurre: una sesión se puede cerrar sin terminarla entera.
 */
const trainedDaysAgo: { days: number; sets: number; total: number; minutes: number }[] = [
  { days: 1, sets: 12, total: 12, minutes: 52 },
  { days: 2, sets: 10, total: 12, minutes: 44 },
  { days: 3, sets: 12, total: 12, minutes: 58 },
  { days: 4, sets: 9, total: 9, minutes: 41 },
  { days: 5, sets: 12, total: 12, minutes: 55 },
  { days: 6, sets: 12, total: 12, minutes: 61 },
  { days: 7, sets: 9, total: 9, minutes: 38 },
  { days: 10, sets: 12, total: 12, minutes: 57 },
  { days: 11, sets: 8, total: 12, minutes: 39 },
  { days: 12, sets: 9, total: 9, minutes: 43 },
]

/**
 * Las series de `routine-1`, aplanadas en el orden en que se ejecutan.
 *
 * SE DERIVA DE LA RUTINA en vez de escribirse otra vez aquí: editar `routine-1`
 * y dejar este historial hablando de ejercicios que ya no tiene daría una
 * progresión de cargas de algo que nadie entrena.
 *
 * El aplanado supone bloques `simple` —todas las series de un ejercicio y luego
 * el siguiente—, que es como está escrita `routine-1`. Una superserie se ejecuta
 * por rondas y aquí saldría en otro orden; el que sabe hacer las dos cosas es
 * `buildSetPlan`, y vive en el dominio de la sesión, que la infraestructura no
 * puede importar.
 */
const ROUTINE_1_SETS = (routinesSeed.find((routine) => routine.id === 'routine-1')?.blocks ?? [])
  .flatMap((block) =>
    block.exercises.flatMap((exercise) =>
      Array.from({ length: exercise.sets }, (_, index) => ({
        prescribedId: exercise.id,
        exerciseId: exercise.exerciseId,
        setNumber: index + 1,
        reps: exercise.reps,
        restSeconds: exercise.restSeconds,
      }))
    )
  )

/**
 * Con qué carga empezó cada ejercicio, en kilos.
 *
 * Sólo los que llevan barra. La plancha no está, y no es un olvido: se mide en
 * segundos y no tiene peso que anotar. Sus series se guardan SIN `weightKg`, que
 * es lo que distingue «no se levantó nada» de «se levantaron cero kilos», y de
 * paso es el caso que la progresión de cargas tiene que saber descartar.
 */
const LOAD_START_KG: Record<string, number> = {
  'sentadilla-barra': 70,
  'press-banca-barra': 50,
  'remo-barra': 55,
}

/** Cuánto sube y cada cuántas sesiones. Un disco de 1,25 por lado, sin prisa. */
const LOAD_STEP_KG = 2.5
const SESSIONS_PER_STEP = 3

/**
 * Lo que se levantó en una sesión del historial.
 *
 * `order` es la posición cronológica —0 la más antigua—, y de ahí sale la subida:
 * sin ella el historial daría una línea plana y la progresión de cargas no
 * enseñaría nada al abrirla por primera vez.
 *
 * Se generan tantas series como `completedSets` diga, recorriendo la rutina en
 * orden. Así una sesión cerrada a medias deja anotado lo que dio tiempo a hacer
 * y no una rutina entera que no ocurrió.
 */
function recordsOf(order: number, completedSets: number): SetRecord[] {
  return ROUTINE_1_SETS.slice(0, completedSets).map((step) => {
    const start = LOAD_START_KG[step.exerciseId]
    const weightKg =
      start === undefined
        ? undefined
        : start + Math.floor(order / SESSIONS_PER_STEP) * LOAD_STEP_KG

    return {
      stepId: `${step.prescribedId}-${step.setNumber}`,
      prescribedId: step.prescribedId,
      exerciseId: step.exerciseId,
      setNumber: step.setNumber,
      prescribedReps: step.reps,
      // El suelo del rango prescrito: se cumplió lo pactado, sin heroicidades.
      repsDone: Number.parseInt(step.reps, 10),
      weightKg,
      workSeconds: 40,
      restSeconds: step.restSeconds,
      prescribedRestSeconds: step.restSeconds,
    }
  })
}

const completedHistory: Session[] = trainedDaysAgo.map(({ days, sets, total, minutes }, index) => ({
  id: `session-history-${days}`,
  crewId: DEV_CREW_ID,
  title: 'Entrenamiento Personal',
  studentId: 'student-1',
  kind: 'individual',
  modality: 'strength',
  category: 'Entrenamiento Personal',
  date: daysAgo(days),
  time: '18:00',
  durationMinutes: 60,
  location: 'Gimnasio Principal',
  status: 'completed',
  notes: '',
  routineId: 'routine-1',
  result: {
    completedSets: sets,
    totalSets: total,
    elapsedSeconds: minutes * 60,
    // Se cerró el mismo día en el que estaba agendada, que es lo corriente.
    completedAt: daysAgo(days),
    /*
     * `trainedDaysAgo` va de la más reciente a la más antigua, así que la
     * posición cronológica es la contraria: la última de la lista es la primera
     * que ocurrió, y es la que tiene que salir más ligera.
     */
    sets: recordsOf(trainedDaysAgo.length - 1 - index, sets),
  },
}))

export const sessionsSeed: Session[] = [
  ...completedHistory,
  {
    id: 'session-1',
    crewId: DEV_CREW_ID,
    title: 'Entrenamiento Personal',
    studentId: 'student-2',
    kind: 'individual',
    modality: 'strength',
    category: 'Entrenamiento Personal',
    date: TODAY,
    time: '09:00',
    durationMinutes: 60,
    location: 'Gimnasio Principal',
    status: 'confirmed',
    notes: 'Enfoque en tren superior',
    routineId: 'routine-2',
    result: null,
  },
  {
    id: 'session-2',
    crewId: DEV_CREW_ID,
    title: 'Evaluación Inicial',
    studentId: 'student-3',
    kind: 'individual',
    modality: 'strength',
    category: 'Evaluación',
    date: TODAY,
    time: '10:30',
    durationMinutes: 45,
    location: 'Sala de Evaluación',
    status: 'pending',
    notes: 'Primera sesión, mediciones corporales',
    routineId: null,
    result: null,
  },
  {
    id: 'session-3',
    crewId: DEV_CREW_ID,
    title: 'Clase Grupal',
    studentId: null,
    kind: 'group',
    modality: 'strength',
    category: 'Entrenamiento Grupal',
    date: TODAY,
    time: '18:00',
    durationMinutes: 45,
    location: 'Sala Grupal',
    status: 'confirmed',
    notes: 'Máximo 8 personas',
    routineId: null,
    result: null,
  },
  {
    id: 'session-4',
    crewId: DEV_CREW_ID,
    title: 'Carrera continua',
    studentId: 'student-4',
    kind: 'individual',
    // La unica de cardio de la semilla: sin ella, el modo de carrera de la
    // sesion en vivo no tendria por donde probarse.
    modality: 'cardio',
    category: 'Seguimiento',
    date: TOMORROW,
    time: '14:00',
    durationMinutes: 30,
    location: 'Oficina',
    status: 'confirmed',
    notes: 'Revisión de progreso mensual',
    routineId: null,
    result: null,
  },
  {
    id: 'session-5',
    crewId: DEV_CREW_ID,
    title: 'Entrenamiento Personal',
    studentId: 'student-1',
    kind: 'individual',
    modality: 'strength',
    category: 'Entrenamiento Personal',
    date: TOMORROW,
    time: '16:30',
    durationMinutes: 60,
    location: 'Gimnasio Principal',
    status: 'cancelled',
    notes: 'Cancelado por el cliente',
    routineId: null,
    result: null,
  },
]
