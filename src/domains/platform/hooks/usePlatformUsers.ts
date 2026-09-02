import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { AppError } from '@/shared/domain/errors'
import type {
  PlatformUser,
  SetMembershipInput,
} from '@/shared/domain/ports/PlatformRepository'
import type { CrewRole } from '@/shared/domain/entities/crew'

/**
 * Cuántas cuentas por página.
 *
 * Veinte y no cien: la lista se mira en el móvil de quien administra tanto como
 * en un portátil, y cien filas obligan a desplazarse eternamente para llegar al
 * paginador. Veinte caben en dos pantallas.
 */
const PAGE_SIZE = 20

interface UsePlatformUsersResult {
  users: PlatformUser[]
  total: number
  page: number
  pageCount: number
  search: string
  role: CrewRole | null
  loading: boolean
  error: string | null
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setRole: (role: CrewRole | null) => void
  setMembership: (input: SetMembershipInput) => Promise<void>
}

/**
 * Las cuentas de la plataforma, por páginas.
 *
 * FILTRAR VUELVE A LA PRIMERA PÁGINA. Sin eso, buscar desde la página cuatro
 * deja una lista vacía cuando el resultado tiene tres, y parece que no hay nada:
 * es el fallo clásico de las tablas paginadas, y se arregla con una línea.
 */
export function usePlatformUsers(): UsePlatformUsersResult {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPageState] = useState(1)
  const [search, setSearchState] = useState('')
  const [role, setRoleState] = useState<CrewRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    try {
      const result = await container.platform.listUsers({
        page,
        pageSize: PAGE_SIZE,
        search,
        role,
      })
      setUsers(result.users)
      setTotal(result.total)
      setError(null)
    } catch (caught) {
      setError(AppError.is(caught) ? caught.message : 'Error al cargar las cuentas')
    } finally {
      setLoading(false)
    }
  }, [page, search, role])

  useEffect(() => {
    void load()
    return container.platform.onChange(() => {
      void load()
    })
  }, [load])

  const setMembership = useCallback(async (input: SetMembershipInput) => {
    try {
      await container.platform.setMembership(input)
      setError(null)
    } catch (caught) {
      setError(AppError.is(caught) ? caught.message : 'No se pudo guardar el cambio')
    }
  }, [])

  return {
    users,
    total,
    page,
    // Al menos una, aunque no haya nadie: «página 1 de 0» no significa nada.
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    search,
    role,
    loading,
    error,
    setPage: setPageState,
    setSearch: (value: string) => {
      setSearchState(value)
      setPageState(1)
    },
    setRole: (value: CrewRole | null) => {
      setRoleState(value)
      setPageState(1)
    },
    setMembership,
  }
}
