import { useCallback } from 'react'
import { container } from '@/app/container'
import type { Routine } from '@/shared/domain/entities/routine'
import type { NewRoutine } from '@/shared/domain/ports/RoutineRepository'

interface UseRoutineActionsResult {
  createRoutine: (data: NewRoutine) => Promise<Routine>
  updateRoutine: (routineId: string, data: NewRoutine) => Promise<void>
}

/**
 * Altas y ediciones de rutinas, contra el puerto.
 *
 * Separado de `useRoutines` porque leer y escribir son responsabilidades
 * distintas: la lista la consumen cinco vistas y sólo el formulario escribe.
 * Meterlo todo en un hook obligaría a cargar la colección entera para guardar.
 *
 * El borrado NO está aquí: tiene una regla de integridad que cruza con los
 * planes, y vive en `useTrainingDeletion` junto a la del plan.
 */
export function useRoutineActions(): UseRoutineActionsResult {
  const createRoutine = useCallback(
    (data: NewRoutine) => container.routines.create(data),
    []
  )

  const updateRoutine = useCallback(
    (routineId: string, data: NewRoutine) => container.routines.update(routineId, data),
    []
  )

  return { createRoutine, updateRoutine }
}
