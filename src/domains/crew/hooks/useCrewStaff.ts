import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { AppError } from '@/shared/domain/errors'
import { lastAdminBlocker } from '@/shared/domain/permissions'
import type { Capability } from '@/shared/domain/permissions'
import type { CrewRole, CrewStaff } from '@/shared/domain/entities/crew'

interface UseCrewStaffResult {
  staff: CrewStaff[]
  loading: boolean
  error: string | null
  /** Por qué NO se le puede cambiar el papel, o `undefined` si se puede. */
  blockerFor: (staffId: string, nextRole: CrewRole | null) => string | undefined
  updateMembership: (
    staffId: string,
    role: CrewRole,
    extraCapabilities: Capability[]
  ) => Promise<void>
  removeStaff: (staffId: string) => Promise<void>
}

/**
 * El equipo técnico del crew activo.
 *
 * `blockerFor` se expone para que la pantalla pueda preguntar ANTES de ofrecer
 * la acción, en vez de dejar pulsar y explicar después. Es el mismo reparto que
 * ya usan las bajas de rutinas y de alumnos: el impedimento se consulta, no se
 * descubre.
 *
 * La regla vive en el dominio y la cumple también el adaptador. Aquí se pregunta
 * para poder explicarla; allí se impone para que no dependa de que se pregunte.
 */
export function useCrewStaff(): UseCrewStaffResult {
  const [staff, setStaff] = useState<CrewStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    try {
      setStaff(await container.crewStaff.findAll())
    } catch (caught) {
      setError(AppError.is(caught) ? caught.message : 'Error al cargar el equipo técnico')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    return container.crewStaff.onChange(() => {
      void load()
    })
  }, [load])

  const blockerFor = useCallback(
    (staffId: string, nextRole: CrewRole | null) => lastAdminBlocker(staff, staffId, nextRole),
    [staff]
  )

  const run = useCallback(async (operation: () => Promise<void>): Promise<void> => {
    try {
      await operation()
      setError(null)
    } catch (caught) {
      setError(AppError.is(caught) ? caught.message : 'No se pudo guardar el cambio')
    }
  }, [])

  const updateMembership = useCallback(
    async (staffId: string, role: CrewRole, extraCapabilities: Capability[]) => {
      await run(async () => {
        // El rol primero: si lo rechaza la regla del último administrador, las
        // capacidades no se tocan y no queda a medio aplicar.
        await container.crewStaff.updateRole(staffId, role)
        await container.crewStaff.updateCapabilities(staffId, extraCapabilities)
      })
    },
    [run]
  )

  const removeStaff = useCallback(
    async (staffId: string) => {
      await run(() => container.crewStaff.remove(staffId))
    },
    [run]
  )

  return { staff, loading, error, blockerFor, updateMembership, removeStaff }
}
