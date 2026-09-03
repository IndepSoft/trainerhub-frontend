import { useCallback } from 'react'
import { container } from '@/app/container'
import { usePlans } from './usePlans'
import { describeNames, findPlansUsingRoutine } from '../libs/usage'
import type { DeletionResult } from '@/shared/domain/deletion'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface UseTrainingDeletionResult {
  /**
   * Por qué NO se puede borrar esta rutina, o `undefined` si se puede.
   *
   * Separado del borrado a propósito: la vista tiene que poder preguntar ANTES
   * de pedir confirmación, para explicar el impedimento en lugar de preguntar
   * algo que ya se sabe que no tiene respuesta.
   */
  routineDeletionBlocker: (routineId: string) => string | undefined
  deleteRoutine: (routineId: string) => Promise<DeletionResult>
  deletePlan: (planId: string) => Promise<DeletionResult>
}

/**
 * Bajas de rutinas y planes, con sus reglas de integridad.
 *
 * LA ASIMETRÍA ES INTENCIONADA. Una rutina programada en algún día de un plan no
 * se puede borrar: el plan guarda `routineId`, y borrarla dejaría un mesociclo
 * apuntando al vacío. Un plan, en cambio, siempre se puede borrar, porque nada
 * apunta a un plan.
 *
 * Es la misma regla que gobierna el catálogo, y la misma que explica por qué los
 * bloques guardados no necesitan protección: se copian al insertarlos, así que
 * ninguna rutina depende de ellos.
 *
 * Las reglas viven aquí y no en los componentes porque la comprobación cruza dos
 * colecciones y ningún componente debería tener que saberlo.
 */
export function useTrainingDeletion(): UseTrainingDeletionResult {
  const { plural } = useTranslation()
  const { plans } = usePlans()


  const routineDeletionBlocker = useCallback(
    (routineId: string): string | undefined => {
      const enUso = findPlansUsingRoutine(plans, routineId)
      if (enUso.length === 0) return undefined

      // El verbo concuerda tambien, no solo el articulo: «La programan el plan»
      // se lee mal y es el tipo de detalle que delata un mensaje montado a
      // trozos.
      const sujeto = plural('deletion.usedByPlan', 'deletion.usedByPlans', enUso.length)
      return `${sujeto} ${describeNames(enUso.map((plan) => plan.title))}.`
    },
    [plans, plural]
  )

  const deleteRoutine = useCallback(
    async (routineId: string): Promise<DeletionResult> => {
      // Se vuelve a comprobar aquí y no se confía en que la vista lo haya hecho:
      // entre abrir el diálogo y confirmar puede haberse creado un plan.
      const reason = routineDeletionBlocker(routineId)
      if (reason !== undefined) return { deleted: false, reason }

      await container.routines.remove(routineId)
      return { deleted: true }
    },
    [routineDeletionBlocker]
  )

  const deletePlan = useCallback(
    async (planId: string): Promise<DeletionResult> => {
      await container.plans.remove(planId)
      return { deleted: true }
    },
    []
  )

  return { routineDeletionBlocker, deleteRoutine, deletePlan }
}
