import { toLocalDateKey } from '@/shared/lib/dateKey'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
// La experiencia vive en `shared/domain` desde que la necesita tambien el
// ranking del equipo: dos formulas para la misma cifra darian dos numeros.
import { completedSessions, totalExperience } from '@/shared/domain/experience'
import type { Session } from '@/shared/domain/entities/session'
import type { LevelProgress, Milestone, StreakStatus } from '../types/gamification.types'

/**
 * Las reglas del juego. Puras: entran sesiones, salen números.
 *
 * ANTES NO HABÍA REGLAS. Nivel 7, 340 de 500 de experiencia y una racha de 12
 * días estaban escritos a mano en un fichero de ejemplo, así que el número no
 * cambiaba entrenando ni dejando de entrenar. Era la parte de la aplicación que
 * más prometía y la única que no medía nada.
 *
 * TODO EL PROGRESO SALE DE LAS SESIONES CERRADAS. No hay contador que se
 * incremente ni total que se guarde: se recalcula a partir del historial, que es
 * el hecho. Un contador guardado se desincroniza en cuanto se corrige, se borra
 * o se importa una sesión, y entonces no hay forma de saber cuál de los dos
 * números miente.
 *
 * Lo que sí es decisión de producto —cuánta experiencia da una serie, cuánto
 * cuesta un nivel, qué hitos hay— vive aquí arriba, junto y con nombre, para que
 * ajustarlo sea cambiar una constante y no rastrear multiplicadores.
 */

// Se reexportan para no tocar a quien ya las importaba de aqui: la experiencia
// subio a `shared/domain` al necesitarla tambien el ranking del equipo.
export { completedSessions, totalExperience }

/**
 * Lo que cuesta cada nivel, en experiencia.
 *
 * Crece de forma lineal —el primero 100, y 50 más cada vez— y no exponencial: a
 * este ritmo un alumno constante sube de nivel cada pocas semanas durante mucho
 * tiempo, mientras que doblando el coste el nivel 10 quedaría a miles de series
 * y la barra dejaría de moverse, que es cuando la gente deja de mirarla.
 */
const BASE_LEVEL_COST = 100
const LEVEL_COST_INCREMENT = 50

function costOfLevel(level: number): number {
  return BASE_LEVEL_COST + (level - 1) * LEVEL_COST_INCREMENT
}

/**
 * Nivel y progreso dentro de él, a partir de la experiencia total.
 *
 * Se descuenta nivel a nivel en vez de despejar una fórmula: el bucle es la
 * definición literal de «cada nivel cuesta esto», así que cambiar el coste no
 * puede desalinearlo de la fórmula inversa. Son unas decenas de vueltas.
 */
export function levelFromExperience(experience: number): LevelProgress {
  let level = 1
  let remaining = experience

  while (remaining >= costOfLevel(level)) {
    remaining -= costOfLevel(level)
    level += 1
  }

  return {
    level,
    currentExperience: remaining,
    experienceForNextLevel: costOfLevel(level),
  }
}

/**
 * La racha: días seguidos entrenando, contando hacia atrás desde hoy.
 *
 * NO SE ROMPE POR NO HABER ENTRENADO HOY TODAVÍA. Si ayer se entrenó y hoy aún
 * no, la racha sigue viva —el día no ha terminado—; se rompe al pasar un día
 * entero en blanco. Contarla desde hoy a secas la pondría a cero cada mañana,
 * que es exactamente lo contrario de lo que una racha debe transmitir.
 *
 * `completedToday` va aparte para poder avisar de que está en riesgo.
 */
export function streakFrom(sessions: Session[], today: Date = new Date()): StreakStatus {
  const trainedDays = trainedDayKeys(sessions)
  const todayKey = toLocalDateKey(today)
  const yesterdayKey = toLocalDateKey(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  )

  const completedToday = trainedDays.has(todayKey)

  let currentDays = 0
  if (completedToday || trainedDays.has(yesterdayKey)) {
    const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (!completedToday) cursor.setDate(cursor.getDate() - 1)

    while (trainedDays.has(toLocalDateKey(cursor))) {
      currentDays += 1
      cursor.setDate(cursor.getDate() - 1)
    }
  }

  return { currentDays, bestDays: longestRun(trainedDays), completedToday }
}

/**
 * Los días con al menos una sesión cerrada, como claves `YYYY-MM-DD`.
 *
 * Por `completedAt` y no por `date`: son cosas distintas. `date` es cuándo
 * estaba agendada, y una sesión del martes que se cierra el miércoles cuenta
 * como entrenamiento del miércoles, que es el día en el que la persona fue.
 */
function trainedDayKeys(sessions: Session[]): Set<string> {
  const days = new Set<string>()
  for (const session of completedSessions(sessions)) {
    if (session.result !== null) days.add(session.result.completedAt)
  }
  return days
}

/** La racha más larga que hubo nunca, para poder compararse con uno mismo. */
function longestRun(trainedDays: Set<string>): number {
  let best = 0

  for (const day of trainedDays) {
    // Sólo se cuenta desde el principio de cada tramo: si el día anterior
    // también se entrenó, este tramo ya se contará desde allí.
    if (trainedDays.has(previousDayKey(day))) continue

    let run = 0
    let cursor = day
    while (trainedDays.has(cursor)) {
      run += 1
      cursor = nextDayKey(cursor)
    }
    best = Math.max(best, run)
  }

  return best
}

/**
 * Vecinos de una clave de fecha.
 *
 * Se pasa por `Date` en vez de restarle uno al día de la cadena: los meses no
 * tienen todos los mismos días y febrero no siempre tiene los mismos. El
 * constructor con tres números normaliza solo —el día 0 de marzo es el último de
 * febrero—, que es justo lo que hace falta.
 */
function shiftDayKey(dayKey: string, days: number): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  return toLocalDateKey(new Date(year, month - 1, day + days))
}

const previousDayKey = (dayKey: string): string => shiftDayKey(dayKey, -1)
const nextDayKey = (dayKey: string): string => shiftDayKey(dayKey, 1)

/**
 * La escalera de hitos.
 *
 * Los peldaños son decisión de producto —cuántas sesiones vale cada uno— y el
 * avance es real. Antes eran las dos cosas inventadas: un hito «3 de 5» que no
 * se movía por mucho que se entrenase.
 *
 * Son ACUMULATIVOS sobre el total de sesiones cerradas, no por semana. Los
 * anteriores decían «semana 1», «semana 2», lo que obliga a decidir desde qué
 * semana se cuenta y castiga a quien se salta una: un hito superado no se
 * pierde.
 */
interface MilestoneStep {
  id: string
  /* Claves, no textos: esta escalera se evalua al importar. Ver el catalogo. */
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  requiredSessions: number
  experienceReward: number
}

const MILESTONE_LADDER: MilestoneStep[] = [
  {
    id: 'first-steps',
    titleKey: 'milestone.firstSteps.title',
    descriptionKey: 'milestone.firstSteps.description',
    requiredSessions: 3,
    experienceReward: 100,
  },
  {
    id: 'consistency',
    titleKey: 'milestone.consistency.title',
    descriptionKey: 'milestone.consistency.description',
    requiredSessions: 7,
    experienceReward: 150,
  },
  {
    id: 'load',
    titleKey: 'milestone.load.title',
    descriptionKey: 'milestone.load.description',
    requiredSessions: 12,
    experienceReward: 200,
  },
  {
    id: 'endurance',
    titleKey: 'milestone.endurance.title',
    descriptionKey: 'milestone.endurance.description',
    requiredSessions: 20,
    experienceReward: 250,
  },
  {
    id: 'milestone',
    titleKey: 'milestone.monthGoal.title',
    descriptionKey: 'milestone.monthGoal.description',
    requiredSessions: 30,
    experienceReward: 400,
  },
]

/**
 * El sendero, con el estado de cada peldaño.
 *
 * Sólo hay un hito `active`: el primero sin superar. Los de más allá quedan
 * `locked` aunque el avance ya sume, porque el sendero se lee como un camino y
 * dos puntos brillando a la vez no dice por dónde se va.
 */
export function milestonesFrom(sessions: Session[]): Milestone[] {
  const done = completedSessions(sessions).length
  let activeFound = false

  // El tipo de retorno se anota en la lambda para que los estados se infieran
  // como literales de `MilestoneState`. Sin el, TypeScript los ensancha a
  // `string` y haria falta un `as`, que aqui no pinta nada.
  return MILESTONE_LADDER.map((step): Milestone => {
    if (done >= step.requiredSessions) {
      return { ...step, state: 'completed', completedSessions: step.requiredSessions }
    }

    const state = activeFound ? 'locked' : 'active'
    activeFound = true
    return { ...step, state, completedSessions: done }
  })
}
