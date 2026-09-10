import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { calculateLevelCompletion, experienceRemaining } from '../libs/gamification.utils'
import { completedSessions, levelFromExperience, streakFrom } from '../libs/progressRules'
import { achievementsFrom } from '../data/badgeCatalog'
import { emptyRoutePath, routePathFrom } from '../libs/routePath'
import type { ProgressRouteCode } from '@/shared/domain/entities/progress'
import type { Achievement } from '../types/achievement.types'
import type { Session } from '@/shared/domain/entities/session'
import type { GamificationProfile, PathNode } from '../types/gamification.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

/**
 * El perfil de quien no ha entrenado nunca.
 *
 * SE CALCULA CON LAS MISMAS REGLAS, sobre un historial vacío, en vez de
 * escribirse a mano: el vacío tiene que enseñar LO QUE VA A TENER —la escalera
 * entera en gris, las veinte insignias por conseguir—, y eso es exactamente lo
 * que devuelven las reglas cuando no hay nada que contar.
 */
const NO_SESSIONS: Session[] = []

const EMPTY_PROFILE: GamificationProfile = {
  streak: streakFrom(NO_SESSIONS),
  level: levelFromExperience(0),
}

const EMPTY_PATH: PathNode[] = emptyRoutePath()

const EMPTY_ACHIEVEMENTS: Achievement[] = achievementsFrom([])

interface UseGamificationProfileResult {
  profile: GamificationProfile
  /** La ruta de desarrollo y su sendero. Hybrid a cero sin equipo. */
  route: ProgressRouteCode
  path: PathNode[]
  achievements: Achievement[]
  /** Sesiones cerradas. */
  completedCount: number
  /** La suma de puntos de todas sus sesiones. De aquí sale el nivel. */
  totalPoints: number
  /** Fracción de 0 a 1 del nivel en curso. Derivada, nunca almacenada. */
  levelCompletion: number
  experienceToNextLevel: number
  loading: boolean
  error: string | null
}

/**
 * El perfil de juego de UN ALUMNO.
 *
 * LOS PUNTOS Y LAS INSIGNIAS LLEGAN DEL SERVIDOR. Antes se recalculaban aquí
 * desde las sesiones —la experiencia con una fórmula escrita dos veces, los
 * logros repasando la historia día a día—; ahora `session_scores` y
 * `student_badges` los escribe la base al cerrar la sesión y este hook los
 * lee. Lo que sigue saliendo de las sesiones es lo que no autoriza nada: la
 * racha y la escalera de hitos, que son presentación.
 *
 * SE SUSCRIBE A LOS TRES: terminar una sesión mueve la racha, los puntos y
 * las insignias sin recargar.
 */
export function useGamificationProfile(studentId?: string): UseGamificationProfileResult {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<GamificationProfile>(EMPTY_PROFILE)
  const [achievements, setAchievements] = useState<Achievement[]>(EMPTY_ACHIEVEMENTS)
  const [route, setRoute] = useState<ProgressRouteCode>('hybrid')
  const [path, setPath] = useState<PathNode[]>(EMPTY_PATH)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    if (studentId === undefined) {
      setProfile(EMPTY_PROFILE)
      setAchievements(EMPTY_ACHIEVEMENTS)
      setRoute('hybrid')
      setPath(EMPTY_PATH)
      setCompletedCount(0)
      setTotalPoints(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [sessions, scores, badges, routeProgress] = await Promise.all([
        container.sessions.findByStudent(studentId),
        container.scores.ofStudent(studentId),
        container.badges.unlockedOf(studentId),
        container.routes.progressOf(studentId),
      ])
      const points = scores.reduce((total, score) => total + score.points, 0)

      setProfile({
        streak: streakFrom(sessions),
        level: levelFromExperience(points),
      })
      setAchievements(achievementsFrom(badges))
      setRoute(routeProgress.routeCode)
      setPath(routePathFrom(routeProgress))
      setCompletedCount(completedSessions(sessions).length)
      setTotalPoints(points)
    } catch (caught) {
      setError(describeError(caught, t, 'progress.error'))
    } finally {
      setLoading(false)
    }
  }, [studentId, t])

  useEffect(() => {
    void load()
    const unsubscribes = [
      container.sessions.onChange(() => void load()),
      container.scores.onChange(() => void load()),
      container.badges.onChange(() => void load()),
      container.routes.onChange(() => void load()),
    ]
    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [load])

  return {
    profile,
    route,
    path,
    achievements,
    completedCount,
    totalPoints,
    levelCompletion: calculateLevelCompletion(profile.level),
    experienceToNextLevel: experienceRemaining(profile.level),
    loading,
    error,
  }
}
