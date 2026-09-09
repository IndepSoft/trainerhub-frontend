import type { CrewStaffRepository, NewCrewStaff } from '@/shared/domain/ports/CrewStaffRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { CrewRole, CrewStaff } from '@/shared/domain/entities/crew'
import { meaningfulExtras, type Capability } from '@/shared/domain/permissions'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toCrewStaff, type CrewStaffRow } from './mappers'
import { subscribeToTable } from './realtime'

/**
 * Las columnas del puesto, con el perfil de la persona incrustado.
 *
 * El nombre y el correo se LEEN de `profiles` en el mismo viaje: PostgREST
 * sigue la clave foranea. Es lo que sustituye a copiarlos en el puesto.
 */
const STAFF_COLUMNS = '*, profiles!crew_staff_profile_id_fkey(first_name, last_name, email)'

/**
 * Implementacion de CrewStaffRepository sobre PostgREST.
 *
 * EL ULTIMO ADMINISTRADOR LO GUARDA POSTGRES, no este adaptador: el disparador
 * `crew_staff_guard_last_admin` levanta `lastAdmin` y `mapDataError` lo
 * convierte en el mismo `AppError` que levantaba la simulacion. La pantalla
 * sigue comprobandolo antes con `lastAdminBlocker` para no dejar pulsar lo que
 * va a fallar; la regla, ahora, vive en un solo sitio que no se puede saltar.
 *
 * `meaningfulExtras` se aplica aqui, como en la simulacion: una concesion que
 * el rol ya incluye no se guarda, porque leerla despues haria pensar que
 * significa algo.
 */
export class SupabaseCrewStaffRepository implements CrewStaffRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<CrewStaff[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase
      .from('crew_staff')
      .select(STAFF_COLUMNS)
      .eq('crew_id', crewId)
      .order('created_at')

    if (error) throw mapDataError(error)
    return ((data ?? []) as CrewStaffRow[]).map(toCrewStaff)
  }

  async findAllByProfileId(profileId: string): Promise<CrewStaff[]> {
    const { data, error } = await supabase
      .from('crew_staff')
      .select(STAFF_COLUMNS)
      .eq('profile_id', profileId)

    if (error) throw mapDataError(error)
    return ((data ?? []) as CrewStaffRow[]).map(toCrewStaff)
  }

  async add(data: NewCrewStaff): Promise<CrewStaff> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new AppError(AppErrorCode.VALIDATION, 'noActiveCrew')
    }
    return this.addToCrew(crewId, data)
  }

  async addToCrew(crewId: string, data: NewCrewStaff): Promise<CrewStaff> {
    /*
     * Un `upsert` sobre (crew_id, profile_id): si la persona ya tiene puesto
     * en ese equipo, se le cambia el rol en vez de fallar por duplicado. Es lo
     * que hacia la simulacion, y es lo que espera «ascender a un alumno».
     */
    const { data: row, error } = await supabase
      .from('crew_staff')
      .upsert(
        {
          crew_id: crewId,
          profile_id: data.profileId,
          role: data.role,
          extra_capabilities: meaningfulExtras(data.role, data.extraCapabilities),
        },
        { onConflict: 'crew_id,profile_id' }
      )
      .select(STAFF_COLUMNS)
      .single()

    if (error) throw mapDataError(error)
    return toCrewStaff(row as CrewStaffRow)
  }

  async updateRole(staffId: string, role: CrewRole): Promise<void> {
    const current = await this.findOne(staffId)

    const { error } = await supabase
      .from('crew_staff')
      .update({
        role,
        extra_capabilities: meaningfulExtras(role, current.extraCapabilities),
      })
      .eq('id', staffId)

    if (error) throw mapDataError(error)
  }

  async updateCapabilities(staffId: string, extraCapabilities: Capability[]): Promise<void> {
    const current = await this.findOne(staffId)

    const { error } = await supabase
      .from('crew_staff')
      .update({ extra_capabilities: meaningfulExtras(current.role, extraCapabilities) })
      .eq('id', staffId)

    if (error) throw mapDataError(error)
  }

  async remove(staffId: string): Promise<void> {
    const { error } = await supabase.from('crew_staff').delete().eq('id', staffId)

    if (error) throw mapDataError(error)
  }

  /**
   * SIN ACOTAR AL EQUIPO ACTIVO, a proposito: el puesto que mas importa
   * anunciar es el que todavia no se tiene. Fundar un equipo o ser ascendido
   * crea una fila en un crew que en ese instante no es el activo -o no hay
   * ninguno-, y `useViewer` depende de este aviso para enterarse.
   */
  onChange(listener: () => void): () => void {
    return subscribeToTable('crew_staff', listener)
  }

  private async findOne(staffId: string): Promise<CrewStaff> {
    const { data, error } = await supabase
      .from('crew_staff')
      .select(STAFF_COLUMNS)
      .eq('id', staffId)
      .maybeSingle()

    if (error) throw mapDataError(error)
    if (data === null) {
      throw new AppError(AppErrorCode.NOT_FOUND, 'notFound')
    }

    return toCrewStaff(data as CrewStaffRow)
  }
}
