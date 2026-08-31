import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { TrainingPlan } from '@/shared/domain/entities/plan'

interface UsePlansResult {
  plans: TrainingPlan[]
  loading: boolean
  error: string | null
}

interface UsePlanResult {
  plan: TrainingPlan | null
  loading: boolean
  error: string | null
}

/**
 * Planes de entrenamiento.
 *
 * Lee del PUERTO, no de un almacén del dominio: la ficha del estudiante también
 * los necesita para mostrar los que tiene asignados, así que los dos leen del
 * mismo sitio y ninguno importa del otro. Misma costura que rutinas y sesiones.
 */
export function usePlans(): UsePlansResult {
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

/**
 * Un plan por su identificador.
 *
 * `null` cuando no existe, no una excepción. Ojo: `plan === null` NO significa
 * «no existe» hasta que `loading` es falso.
 */
export function usePlan(planId: string | undefined): UsePlanResult {
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (planId === undefined) {
      setPlan(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    const load = () => {
      container.plans
        .findById(planId)
        .then((result) => {
          if (active) setPlan(result)
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : 'Error al cargar el plan')
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
  }, [planId])

  return { plan, loading, error }
}
