// Se importa la clave de fecha compartida en vez de repetirla: habia tres
// copias suyas en el proyecto, y ese fue el motivo de subirla a `shared/lib`.
import { toLocalDateKey as toKey } from '@/shared/lib/dateKey'
import { streakFrom } from '../libs/progressRules'
import type { AchievementDefinition } from '../types/achievement.types'
import type { Session } from '@/shared/domain/entities/session'

/** El primer tramo que la agenda ofrece. Ver `SESSION_TIME_SLOTS`. */
const EARLIEST_SLOT = '08:00'

/**
 * Catálogo de logros, con la condición de cada uno EN CÓDIGO.
 *
 * Antes la condición era prosa —«Entrena 7 días seguidos»— y al lado, escrita a
 * mano, una fecha de desbloqueo de enero de 2024. Nada comprobaba lo primero y
 * nada producía lo segundo: la galería enseñaba seis logros conseguidos el
 * primer día, sin haber entrenado nunca, y ninguno se conseguía jamás
 * entrenando. La descripción sigue estando, pero ahora es la traducción al
 * castellano de `condition`, no una promesa aparte.
 *
 * SE FUERON DIEZ LOGROS, los de las categorías «métricas» y «desafíos»: pesarse,
 * subir fotos de progreso, subir un 25 % el máximo, completar desafíos. No hay
 * de dónde sacarlos —no existe registro corporal ni sistema de desafíos—, y un
 * logro que no puede conseguirse nunca es peor que no ofrecerlo. Vuelven cuando
 * haya datos que los sostengan.
 *
 * TODO: recuperar esos diez cuando existan (a) un registro de medidas corporales
 * y fotos, y (b) el sistema de desafíos, del que hoy sólo hay la tarjeta.
 */
export const achievementCatalog: AchievementDefinition[] = [
  {
    id: 'perfect-week',
    nameKey: 'achievement.perfectWeek.name',
    descriptionKey: 'achievement.perfectWeek.description',
    icon: 'trophy',
    category: 'attendance',
    rarity: 'common',
    pointsReward: 100,
    condition: (sessions, asOf) => streakFrom(sessions, asOf).currentDays >= 7,
  },
  {
    id: 'monthly-warrior',
    nameKey: 'achievement.monthlyWarrior.name',
    descriptionKey: 'achievement.monthlyWarrior.description',
    icon: 'medal',
    category: 'attendance',
    rarity: 'rare',
    pointsReward: 300,
    // «En 30 días» y no «en un mes natural»: entrenar del 20 de marzo al 18 de
    // abril es el mismo esfuerzo que hacerlo dentro de marzo, y el mes natural
    // se lo negaría por un detalle del calendario.
    condition: (sessions, asOf) => countCompletedWithin(sessions, asOf, 30) > 20,
  },
  {
    id: 'never-miss-monday',
    nameKey: 'achievement.neverMissMonday.name',
    descriptionKey: 'achievement.neverMissMonday.description',
    icon: 'star',
    category: 'attendance',
    rarity: 'common',
    pointsReward: 150,
    condition: (sessions, asOf) => consecutiveMondays(sessions, asOf) >= 4,
  },
  {
    id: 'early-bird',
    nameKey: 'achievement.earlyBird.name',
    descriptionKey: 'achievement.earlyBird.description',
    icon: 'award',
    category: 'attendance',
    rarity: 'rare',
    pointsReward: 200,
    // Decía «antes de las 8:00» y era inalcanzable: el primer tramo que la
    // agenda ofrece SON las 8:00, así que ninguna sesión podía cumplirlo.
    condition: (sessions) => countCompleted(sessions, (s) => s.time === EARLIEST_SLOT) >= 10,
  },
  {
    id: 'habit-former',
    nameKey: 'achievement.habitFormer.name',
    descriptionKey: 'achievement.habitFormer.description',
    icon: 'flame',
    category: 'consistency',
    rarity: 'rare',
    pointsReward: 500,
    condition: (sessions, asOf) => streakFrom(sessions, asOf).currentDays >= 21,
  },
  {
    id: 'unstoppable',
    nameKey: 'achievement.unstoppable.name',
    descriptionKey: 'achievement.unstoppable.description',
    icon: 'flame',
    category: 'consistency',
    rarity: 'epic',
    pointsReward: 1000,
    condition: (sessions, asOf) => streakFrom(sessions, asOf).currentDays >= 50,
  },
  {
    id: 'legend',
    nameKey: 'achievement.legend.name',
    descriptionKey: 'achievement.legend.description',
    icon: 'flame',
    category: 'consistency',
    rarity: 'legendary',
    pointsReward: 2500,
    condition: (sessions, asOf) => streakFrom(sessions, asOf).currentDays >= 100,
  },
  {
    id: 'iron-will',
    nameKey: 'achievement.ironWill.name',
    descriptionKey: 'achievement.ironWill.description',
    icon: 'target',
    category: 'consistency',
    rarity: 'epic',
    pointsReward: 750,
    // El mínimo de diez está para que no se consiga en la primera sesión: una de
    // una es el 100 %, y un logro épico que cae el primer día no significa nada.
    condition: (sessions) => {
      const settled = sessions.filter((session) => session.status !== 'pending')
      if (settled.length < 10) return false

      const completed = settled.filter((session) => session.status === 'completed')
      return completed.length / settled.length >= 0.9
    },
  },
]

function countCompleted(sessions: Session[], predicate: (session: Session) => boolean): number {
  return sessions.filter((session) => session.status === 'completed' && predicate(session)).length
}

function countCompletedWithin(sessions: Session[], asOf: Date, days: number): number {
  const from = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate() - days + 1)

  return countCompleted(sessions, (session) => {
    if (session.result === null) return false
    return session.result.completedAt >= toKey(from)
  })
}

/**
 * Lunes seguidos entrenados, contando hacia atrás desde el último lunes pasado.
 *
 * Se empieza en el lunes de la semana en curso sólo si ya se entrenó; si no, la
 * cuenta arranca en el anterior. Un lunes que todavía no ha llegado no rompe
 * nada: la semana no ha terminado.
 */
function consecutiveMondays(sessions: Session[], asOf: Date): number {
  const trained = new Set<string>()
  for (const session of sessions) {
    if (session.status === 'completed' && session.result !== null) {
      trained.add(session.result.completedAt)
    }
  }

  const isoWeekday = (asOf.getDay() + 6) % 7
  const cursor = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate() - isoWeekday)
  if (!trained.has(toKey(cursor))) cursor.setDate(cursor.getDate() - 7)

  let run = 0
  while (trained.has(toKey(cursor))) {
    run += 1
    cursor.setDate(cursor.getDate() - 7)
  }

  return run
}
