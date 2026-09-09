import type {
  CrewOverview,
  PlatformRepository,
  SetMembershipInput,
  UserPage,
  UserPageQuery,
} from '@/shared/domain/ports/PlatformRepository'
import type { SubscriptionStatus } from '@/shared/domain/entities/crew'
import { meaningfulExtras } from '@/shared/domain/permissions'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { subscribeToTables } from './realtime'
import {
  toCrewOverview,
  toPlatformUser,
  type PlatformCrewRow,
  type PlatformUserRow,
} from './mappers'

/**
 * Implementacion de PlatformRepository sobre funciones del servidor.
 *
 * CADA METODO ES UNA FUNCION `SECURITY DEFINER` QUE EMPIEZA COMPROBANDO QUE
 * QUIEN PREGUNTA ADMINISTRA LA PLATAFORMA. Era el TODO del puerto: «con
 * backend, cada metodo de aqui exige rol de plataforma EN EL SERVIDOR». Este
 * adaptador no decide nada; transporta.
 *
 * `isAdmin` es la excepcion: consulta `is_platform_admin`, que es la misma
 * funcion que usan las politicas. Una sola definicion de quien administra.
 */
export class SupabasePlatformRepository implements PlatformRepository {
  async isAdmin(profileId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_platform_admin', { user_id: profileId })

    if (error) throw mapDataError(error)
    return data === true
  }

  async listCrews(): Promise<CrewOverview[]> {
    const { data, error } = await supabase.rpc('platform_list_crews')

    if (error) throw mapDataError(error)
    return ((data ?? []) as PlatformCrewRow[]).map(toCrewOverview)
  }

  async listUsers(query: UserPageQuery): Promise<UserPage> {
    const { data, error } = await supabase.rpc('platform_list_users', {
      page: query.page,
      page_size: query.pageSize,
      search: query.search,
      role_filter: query.role,
    })

    if (error) throw mapDataError(error)

    const rows = (data ?? []) as PlatformUserRow[]
    return {
      users: rows.map(toPlatformUser),
      // El total viaja en cada fila porque una funcion devuelve una forma. Sin
      // filas no hay total que leer: es cero.
      total: rows.length === 0 ? 0 : Number(rows[0].total),
    }
  }

  async setMembership(input: SetMembershipInput): Promise<void> {
    const { error } = await supabase.rpc('platform_set_membership', {
      membership_id: input.membershipId,
      new_role: input.role,
      new_extra_capabilities: meaningfulExtras(input.role, input.extraCapabilities),
    })

    if (error) throw mapDataError(error)
  }

  async setSubscription(crewId: string, status: SubscriptionStatus): Promise<void> {
    const { error } = await supabase.rpc('platform_set_subscription', {
      crew: crewId,
      new_status: status,
    })

    if (error) throw mapDataError(error)
  }

  /**
   * TRES TABLAS EN UN SOLO CANAL, porque el panel de plataforma pinta lo que
   * sale de las tres: las cuentas de `profiles`, los puestos de `crew_staff` y
   * los equipos con su suscripcion de `crews`.
   *
   * No se acota a nada: quien administra la plataforma mira por encima de los
   * equipos, y es RLS -`is_platform_admin`- quien decide que le llega. A quien
   * no administra no le llega nada de esto aunque escuche.
   */
  onChange(listener: () => void): () => void {
    return subscribeToTables(['profiles', 'crew_staff', 'crews'], listener)
  }
}
