import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { AppError } from '@/shared/domain/errors'
import { calculateLevelCompletion, experienceRemaining } from '../libs/gamification.utils'
import {
  completedSessions,
  levelFromExperience,
  milestonesFrom,
  streakFrom,
  totalExperience,
} from '../libs/progressRules'
import { evaluateAchievements } from '../libs/achievementEvaluation'
import type { Achievement } from '../types/achievement.types'
import type { GamificationProfile } from '../types/gamification.types'

/** Perfil en blanco, para antes de que llegue el historial y para «sin alumno». */
const EMPTY_PROFILE: GamificationProfile = {
  streak: { currentDays: 0, bestDays: 0, completedToday: false },
  level: { level: 1, currentExperience: 0, experienceForNextLevel: 100 },
  milestones: [],
}

interface UseGamificationProfileResult {
  profile: GamificationProfile
  achievements: Achievement[]
  /** Sesiones cerradas. Es la cifra de la que sale todo lo demás. */
  completedCount: number
  /** Fracción de 0 a 1 del nivel en curso. Derivada, nunca almacenada. */
  levelCompletion: number
  experienceToNextLevel: number
  loading: boolean
  error: string | null
}

/**
 * El perfil de juego de UN ALUMNO, calculado desde sus sesiones.
 *
 * ANTES NO ERA DE NADIE. Devolvía un objeto escrito a mano —nivel 7, racha de 12
 * días, hitos a medias— idéntico para todo el mundo y sin argumentos: la
 * pantalla de progreso enseñaba lo mismo estuviera quien estuviera delante y se
 * hubiera entrenado o no.
 *
 * Ahora recibe el alumno y lo deriva de su historial por los puertos. Las
 * reglas viven en `progressRules`, que es puro y comprobable; aquí sólo se
 * orquesta el estado.
 *
 * SE SUSCRIBE A LOS CAMBIOS: terminar una sesión recalcula la racha y el nivel
 * sin recargar, igual que hace el panel.
 */
export function useGamificationProfile(studentId?: string): UseGamificationProfileResult {
  const [profile, setProfile] = useState<GamificationProfile>(EMPTY_PROFILE)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    if (studentId === undefined) {
      setProfile(EMPTY_PROFILE)
      setAchievements([])
      setCompletedCount(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const sessions = await container.sessions.findByStudent(studentId)

      setProfile({
        streak: streakFrom(sessions),
        level: levelFromExperience(totalExperience(sessions)),
        milestones: milestonesFrom(sessions),
      })
      setAchievements(evaluateAchievements(sessions))
      setCompletedCount(completedSessions(sessions).length)
    } catch (caught) {
      setError(AppError.is(caught) ? caught.message : 'Error al cargar el progreso')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    void load()
    return container.sessions.onChange(() => {
      void load()
    })
  }, [load])

  return {
    profile,
    achievements,
    completedCount,
    levelCompletion: calculateLevelCompletion(profile.level),
    experienceToNextLevel: experienceRemaining(profile.level),
    loading,
    error,
  }
}
