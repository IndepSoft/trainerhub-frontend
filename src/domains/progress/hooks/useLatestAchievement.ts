import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import { achievementsFrom } from '../data/badgeCatalog'
import { unlockedAchievements } from '../libs/badges'
import { streakFrom } from '../libs/progressRules'
import { BADGE_RARITIES, type SessionScore } from '@/shared/domain/entities/progress'
import type { Achievement } from '../types/achievement.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface UseLatestAchievementResult {
  /** La insignia más rara de las que ESTA sesión desbloqueó, o `null`. */
  achievement: Achievement | null
  /** Lo que valió la sesión, o `null` si no puntuó. */
  score: SessionScore | null
  /** Cifra protagonista de la celebración y su etiqueta. */
  headlineValue: number
  headlineLabel: string
  loading: boolean
}

/**
 * Qué se celebra al terminar una sesión.
 *
 * LO NUEVO, Y SÓLO LO NUEVO. Antes se tomaba el último logro conseguido de
 * toda la historia, sin nada con que comparar, así que cerrar cualquier sesión
 * volvía a celebrar la misma «Semana perfecta» de hace un mes. Ahora el
 * servidor deja escrito qué sesión desbloqueó cada insignia, y aquí se piden
 * las de ésta.
 *
 * Sin insignia nueva se celebra igual: la puntuación de la sesión y la racha
 * existen siempre, y son lo que el usuario reconoce como suyo.
 */
export function useLatestAchievement(sessionId?: string): UseLatestAchievementResult {
  const { t } = useTranslation()
  const [achievement, setAchievement] = useState<Achievement | null>(null)
  const [score, setScore] = useState<SessionScore | null>(null)
  const [streakDays, setStreakDays] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async (): Promise<void> => {
      if (sessionId === undefined) {
        setLoading(false)
        return
      }

      const session = await container.sessions.findById(sessionId)
      if (session === null || session.studentId === null) {
        if (active) setLoading(false)
        return
      }

      const [sessions, sessionScore, fresh] = await Promise.all([
        container.sessions.findByStudent(session.studentId),
        container.scores.ofSession(sessionId),
        container.badges.newIn(sessionId),
      ])
      if (!active) return

      // Si la sesión desbloqueó varias, se celebra la más rara: es la que más
      // cuesta conseguir, y la galería enseña el resto.
      const unlocked = unlockedAchievements(achievementsFrom(fresh)).sort(
        (left, right) => BADGE_RARITIES.indexOf(right.rarity) - BADGE_RARITIES.indexOf(left.rarity)
      )
      setAchievement(unlocked[0] ?? null)
      setScore(sessionScore)
      setStreakDays(streakFrom(sessions).currentDays)
      setLoading(false)
    }

    void load()
    return () => {
      active = false
    }
  }, [sessionId])

  return {
    achievement,
    score,
    headlineValue: streakDays,
    headlineLabel: t('progress.consecutiveDays'),
    loading,
  }
}
