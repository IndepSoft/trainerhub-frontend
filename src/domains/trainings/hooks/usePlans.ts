import { useMemo } from 'react'
import { usePlansStore } from '../stores/plansStore'
import type { TrainingPlan } from '../types/training.types'

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
 * Devuelve UNA lista. Hubo una partición en propios y plantillas: la marca que
 * la sostenía ya no existe en el modelo, porque no gobernaba ningún
 * comportamiento y, sin nada asignado a ningún estudiante, todos los planes eran
 * igualmente plantillas. El razonamiento está en `types/training.types.ts`.
 *
 * Lee del almacén y no del fichero de datos simulados, que ha pasado a ser su
 * semilla: es lo que permite que un plan recién creado aparezca aquí.
 */
export function usePlans(): UsePlansResult {
  const plans = usePlansStore((state) => state.plans)

  return { plans, loading: false, error: null }
}

/**
 * Un plan por su identificador.
 *
 * `null` cuando no existe, no una excepción: un enlace viejo es un resultado
 * válido y la vista debe poder pintarlo. Misma semántica de lo ausente que
 * declaran los puertos.
 */
export function usePlan(planId: string | undefined): UsePlanResult {
  const plans = usePlansStore((state) => state.plans)

  const plan = useMemo(() => {
    if (!planId) return null
    return plans.find((candidate) => candidate.id === planId) ?? null
  }, [plans, planId])

  return { plan, loading: false, error: null }
}
