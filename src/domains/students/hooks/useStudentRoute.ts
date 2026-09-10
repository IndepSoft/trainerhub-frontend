import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { ProgressRouteCode, RouteProgress, SessionScore, StudentBadge } from '@/shared/domain/entities/progress'
import { BADGES_REQUIRING_VALIDATION } from '@/shared/domain/entities/progress'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

interface UseStudentRouteResult {
  progress: RouteProgress | null
  /** Insignias del alumno que esperan confirmación. */
  pendingBadges: StudentBadge[]
  /** Sesiones marcadas por salto de carga y sin revisar. */
  flagged: SessionScore[]
  loading: boolean
  saving: boolean
  error: string | null
  chooseRoute: (route: ProgressRouteCode) => Promise<void>
  validateMilestone: (position: number, notes: string) => Promise<void>
  validateBadge: (code: string) => Promise<void>
  acceptLoadJump: (sessionId: string) => Promise<void>
}

/**
 * Lo que el entrenador decide sobre el progreso de UN alumno.
 *
 * Tres decisiones, y las tres pasan por funciones del servidor que comprueban
 * `students.manage`: la ruta, los hitos de la ruta, y las insignias de Platino
 * y Diamante. Y una revisión: las sesiones marcadas por un salto de carga que
 * no parece una progresión.
 */
export function useStudentRoute(studentId: string | undefined): UseStudentRouteResult {
  const { t } = useTranslation()
  const [progress, setProgress] = useState<RouteProgress | null>(null)
  const [pendingBadges, setPendingBadges] = useState<StudentBadge[]>([])
  const [flagged, setFlagged] = useState<SessionScore[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    if (studentId === undefined) {
      setLoading(false)
      return
    }
    try {
      const [routeProgress, badges, scores] = await Promise.all([
        container.routes.progressOf(studentId),
        container.badges.unlockedOf(studentId),
        container.scores.flaggedOf(studentId),
      ])
      setProgress(routeProgress)
      setPendingBadges(
        badges.filter(
          (badge) => BADGES_REQUIRING_VALIDATION.includes(badge.code) && badge.validatedAt === null
        )
      )
      setFlagged(scores)
    } catch (caught) {
      setError(describeError(caught, t, 'studentRoute.error'))
    } finally {
      setLoading(false)
    }
  }, [studentId, t])

  useEffect(() => {
    void load()
    const unsubscribes = [
      container.routes.onChange(() => void load()),
      container.badges.onChange(() => void load()),
      container.scores.onChange(() => void load()),
    ]
    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [load])

  const run = useCallback(
    async (operation: () => Promise<void>): Promise<void> => {
      setSaving(true)
      setError(null)
      try {
        await operation()
        await load()
      } catch (caught) {
        setError(describeError(caught, t, 'studentRoute.saveError'))
      } finally {
        setSaving(false)
      }
    },
    [load, t]
  )

  const chooseRoute = useCallback(
    (route: ProgressRouteCode) =>
      run(async () => {
        if (studentId !== undefined) await container.routes.choose(studentId, route)
      }),
    [run, studentId]
  )

  const validateMilestone = useCallback(
    (position: number, notes: string) =>
      run(async () => {
        if (studentId === undefined || progress === null) return
        await container.routes.validateMilestone({ studentId, route: progress.routeCode, position, notes })
      }),
    [run, studentId, progress]
  )

  const validateBadge = useCallback(
    (code: string) =>
      run(async () => {
        if (studentId !== undefined) await container.badges.validate(studentId, code)
      }),
    [run, studentId]
  )

  const acceptLoadJump = useCallback(
    (sessionId: string) => run(() => container.scores.acceptLoadJump(sessionId)),
    [run]
  )

  return {
    progress,
    pendingBadges,
    flagged,
    loading,
    saving,
    error,
    chooseRoute,
    validateMilestone,
    validateBadge,
    acceptLoadJump,
  }
}
