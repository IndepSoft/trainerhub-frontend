import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { TrainingPlan } from '@/shared/domain/entities/plan'

interface UseAssignablePlansResult {
  plans: TrainingPlan[]
  loading: boolean
  error: string | null
}

/**
 * Planes que se le pueden asignar a un alumno.
 *
 * Hermano de `useAssignableRoutines`, sobre el puerto de planes. Cada dominio
 * tiene el suyo para que ninguno importe del vecino, aunque los dos vean lo
 * mismo.
 */
export function useAssignablePlans(): UseAssignablePlansResult {
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = () => {
      container.plans
        .findAll()
        .then((result) => {
          if (active) setPlans(result)
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : 'Error al cargar planes')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    load()
    const unsubscribe = container.plans.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { plans, loading, error }
}
