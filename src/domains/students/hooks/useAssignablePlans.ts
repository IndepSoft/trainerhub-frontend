import { container } from '@/app/container'
import { crewScope } from '@/app/crewScope'
import { useCachedQuery } from '@/shared/hooks/useCachedQuery'
import type { TrainingPlan } from '@/shared/domain/entities/plan'

interface UseAssignablePlansResult {
  plans: TrainingPlan[]
  loading: boolean
  error: string | null
}

/** Referencia estable para el «todavía nada». */
const NONE: TrainingPlan[] = []

/**
 * Planes que se le pueden asignar a un alumno.
 *
 * Hermano de `useAssignableRoutines`, sobre el puerto de planes. Cada dominio
 * tiene el suyo para que ninguno importe del vecino, aunque los dos vean lo
 * mismo.
 */
export function useAssignablePlans(): UseAssignablePlansResult {
  const { data, loading, error } = useCachedQuery<TrainingPlan[]>({
    // El equipo activo, en la clave: lo de un equipo no responde por otro.
    key: ['plans', crewScope.current()],
    load: () => container.plans.findAll(),
    subscribe: (reload) => container.plans.onChange(reload),
    initial: NONE,
    errorKey: 'students.plansError',
  })

  return { plans: data, loading, error }
}
