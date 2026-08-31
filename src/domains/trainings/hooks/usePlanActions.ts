import { useCallback } from 'react'
import { container } from '@/app/container'
import type { TrainingPlan } from '@/shared/domain/entities/plan'

interface UsePlanActionsResult {
  createPlan: (data: Omit<TrainingPlan, 'id'>) => Promise<TrainingPlan>
  updatePlan: (planId: string, data: Omit<TrainingPlan, 'id'>) => Promise<void>
}

/**
 * Altas y ediciones de planes, contra el puerto.
 *
 * Separado de `usePlans` por lo mismo que `useRoutineActions`: leer y escribir
 * son responsabilidades distintas, y el formulario no tiene por qué cargar la
 * colección entera para guardar.
 */
export function usePlanActions(): UsePlanActionsResult {
  const createPlan = useCallback(
    (data: Omit<TrainingPlan, 'id'>) => container.plans.create(data),
    []
  )

  const updatePlan = useCallback(
    (planId: string, data: Omit<TrainingPlan, 'id'>) => container.plans.update(planId, data),
    []
  )

  return { createPlan, updatePlan }
}
