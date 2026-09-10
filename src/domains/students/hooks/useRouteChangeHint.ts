import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import {
  ROUTE_BY_OBJECTIVE,
  type ProgressRouteCode,
  type RouteProgress,
} from '@/shared/domain/entities/progress'
import type { TrainingPlan } from '@/shared/domain/entities/plan'

/** Qué le pasa a la ruta del alumno si se le asigna este plan. */
export interface RouteChangeHint {
  /** La ruta en la que está hoy. */
  current: ProgressRouteCode
  /** La ruta a la que lleva el objetivo del plan. */
  next: ProgressRouteCode
  /**
   * `change`: asignar el plan le mueve de ruta. `same`: el plan lleva a la
   * que ya sigue. `chosen`: el entrenador la eligió a mano y el plan no la
   * toca.
   */
  outcome: 'change' | 'same' | 'chosen'
}

/**
 * El efecto de asignar un plan sobre la ruta de desarrollo, para decirlo
 * ANTES de asignar.
 *
 * `route_of_student` toma el objetivo del último plan asignado salvo ruta
 * elegida a mano, y las validaciones de hito son por ruta: un alumno en
 * Consolidación de Titan aparece en Iniciación de Endurance en cuanto se le
 * asigna un plan de resistencia. El efecto existía y era invisible desde el
 * diálogo de asignar; aquí se calcula con la misma tabla que usa el servidor
 * (`ROUTE_BY_OBJECTIVE`, comparada por contrato).
 */
export function useRouteChangeHint(
  studentId: string,
  plans: TrainingPlan[],
  planId: string
): RouteChangeHint | null {
  const [progress, setProgress] = useState<RouteProgress | null>(null)

  useEffect(() => {
    let active = true

    const load = () => {
      container.routes
        .progressOf(studentId)
        .then((result) => {
          if (active) setProgress(result)
        })
        // Sin ruta no hay aviso que dar: el diálogo sigue sirviendo igual.
        .catch(() => {
          if (active) setProgress(null)
        })
    }

    load()
    const unsubscribe = container.routes.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [studentId])

  if (progress === null || planId === '') return null

  const plan = plans.find((candidate) => candidate.id === planId)
  if (plan === undefined) return null

  const next = ROUTE_BY_OBJECTIVE[plan.objectiveId] ?? 'hybrid'
  const current = progress.routeCode

  if (progress.chosenByTrainer) return { current, next, outcome: 'chosen' }
  if (next === current) return { current, next, outcome: 'same' }
  return { current, next, outcome: 'change' }
}
