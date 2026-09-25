import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import { crewScope } from '@/app/crewScope'
import { useCachedQuery } from '@/shared/hooks/useCachedQuery'
import type { TrainingPlan } from '@/shared/domain/entities/plan'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

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

/** Referencia estable para el «todavía nada». */
const NONE: TrainingPlan[] = []

/**
 * Planes de entrenamiento.
 *
 * Lee del PUERTO, no de un almacén del dominio: la ficha del estudiante también
 * los necesita para mostrar los que tiene asignados, así que los dos leen del
 * mismo sitio y ninguno importa del otro. Misma costura que rutinas y sesiones.
 */
export function usePlans(): UsePlansResult {
  const { data, loading, error } = useCachedQuery<TrainingPlan[]>({
    // El equipo activo, en la clave: lo de un equipo no responde por otro.
    key: ['plans', crewScope.current()],
    load: () => container.plans.findAll(),
    subscribe: (reload) => container.plans.onChange(reload),
    initial: NONE,
    errorKey: 'plan.loadError',
  })

  return { plans: data, loading, error }
}

/**
 * Un plan por su identificador.
 *
 * `null` cuando no existe, no una excepción. Ojo: `plan === null` NO significa
 * «no existe» hasta que `loading` es falso.
 */
export function usePlan(planId: string | undefined): UsePlanResult {
  const { t } = useTranslation()
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
          if (active) setError(describeError(cause, t, 'plan.loadOneError'))
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
  }, [planId, t])

  return { plan, loading, error }
}
