import { toLocalDateKey } from '@/shared/lib/dateKey'
import { achievementCatalog } from '../data/achievementCatalog'
import type { Achievement } from '../types/achievement.types'
import type { Session } from '@/shared/domain/entities/session'

/**
 * Evalúa el catálogo contra el historial de un alumno.
 *
 * SE REPASA LA HISTORIA DÍA A DÍA, en vez de comprobar cada condición sólo con
 * los datos de hoy. Es lo que permite saber CUÁNDO se consiguió cada logro, que
 * es el dato que la galería enseña —y que antes estaba escrito a mano, con
 * fechas de enero de 2024—. Además hace que un logro conseguido no se pierda:
 * quien tuvo una racha de 21 días y luego enfermó sigue teniendo «Hábito
 * Formado», porque el día en que lo cumplió no deja de haber ocurrido.
 *
 * El coste es el número de días entrenados por el de logros. Para una persona
 * son unos cientos por ocho; si algún día deja de ser trivial, el desbloqueo se
 * guarda al conseguirlo y esta función pasa a ser sólo la definición de la
 * regla.
 */
export function evaluateAchievements(sessions: Session[], today: Date = new Date()): Achievement[] {
  const checkpoints = evaluationDays(sessions, today)

  return achievementCatalog.map((definition) => {
    for (const day of checkpoints) {
      // Lo que se sabía al terminar ese día. Sin este recorte, una condición
      // «racha de 7» se daría por cumplida en la primera fecha del historial,
      // porque estaría viendo sesiones del futuro.
      const known = sessions.filter((session) => session.date <= toLocalDateKey(day))

      if (definition.condition(known, day)) {
        return { ...definition, unlockedAt: day }
      }
    }

    return { ...definition }
  })
}

/**
 * Los días en los que tiene sentido comprobar, en orden.
 *
 * Los días entrenados, más hoy. Sólo los entrenados porque nada cambia un día
 * sin sesión —ninguna condición mejora por dejar pasar el tiempo—, y hoy porque
 * las condiciones que miran la racha en curso se evalúan contra la fecha actual.
 */
function evaluationDays(sessions: Session[], today: Date): Date[] {
  const keys = new Set<string>()
  for (const session of sessions) {
    if (session.status === 'completed' && session.result !== null) {
      keys.add(session.result.completedAt)
    }
  }
  keys.add(toLocalDateKey(today))

  return [...keys].sort().map(fromKey)
}

function fromKey(dayKey: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Los conseguidos, del más reciente al más antiguo. */
export function unlockedAchievements(achievements: Achievement[]): Achievement[] {
  const unlocked = achievements.filter(
    (achievement): achievement is Achievement & { unlockedAt: Date } =>
      achievement.unlockedAt instanceof Date
  )

  // Copia implícita del `filter`, así que ordenar aquí no muta nada de fuera.
  return unlocked.sort((first, second) => second.unlockedAt.getTime() - first.unlockedAt.getTime())
}
