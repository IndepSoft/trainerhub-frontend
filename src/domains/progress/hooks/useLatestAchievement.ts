import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import { evaluateAchievements, unlockedAchievements } from '../libs/achievementEvaluation'
import { streakFrom } from '../libs/progressRules'
import type { Achievement } from '../types/achievement.types'

interface UseLatestAchievementResult {
  achievement: Achievement | null
  /** Cifra protagonista de la celebración y su etiqueta. */
  headlineValue: number
  headlineLabel: string
  loading: boolean
}

/**
 * Qué se celebra al terminar una sesión.
 *
 * SE CELEBRA A QUIEN ENTRENÓ. Antes leía el catálogo simulado y una racha
 * escrita a mano, así que la pantalla felicitaba por «12 días seguidos» a
 * cualquiera, siempre, y por un logro con fecha de enero de 2024. Ahora recibe
 * la sesión recién cerrada, resuelve de quién es y evalúa su historial de
 * verdad.
 *
 * La cifra protagonista es la racha y no los puntos del logro: es el dato que el
 * usuario reconoce como suyo, y el que el registro agresivo debe gritar. Los
 * puntos van en letra pequeña, como recompensa.
 */
export function useLatestAchievement(sessionId?: string): UseLatestAchievementResult {
  const [achievement, setAchievement] = useState<Achievement | null>(null)
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

      const sessions = await container.sessions.findByStudent(session.studentId)
      if (!active) return

      setAchievement(unlockedAchievements(evaluateAchievements(sessions))[0] ?? null)
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
    headlineValue: streakDays,
    headlineLabel: 'días seguidos',
    loading,
  }
}
