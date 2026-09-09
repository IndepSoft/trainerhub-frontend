import type { CrewRepository, CrewSettings, NewCrew } from '@/shared/domain/ports/CrewRepository'
import type { Crew } from '@/shared/domain/entities/crew'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toCrew, toCrewSettingsRow, type CrewRow } from './mappers'

/**
 * Implementacion de CrewRepository sobre PostgREST.
 *
 * CREAR NO ES UN INSERT. `create_crew` crea el equipo y nombra a su primer
 * administrador en la misma transaccion; la tabla no admite altas sueltas.
 * `NewCrew.ownerId` no viaja: el servidor toma al fundador de la sesion, que es
 * la unica fuente en la que se puede confiar para eso.
 *
 * BUSCAR POR TOKEN tampoco es una consulta: quien escanea el QR no es miembro y
 * RLS no le dejaria ver la fila. `find_crew_by_join_token` devuelve solo lo que
 * la pantalla de unirse enseña.
 */
export class SupabaseCrewRepository implements CrewRepository {
  async findById(crewId: string): Promise<Crew | null> {
    const { data, error } = await supabase.from('crews').select('*').eq('id', crewId).maybeSingle()

    if (error) throw mapDataError(error)
    return data === null ? null : toCrew(data as CrewRow)
  }

  async findByJoinToken(joinToken: string): Promise<Crew | null> {
    const { data, error } = await supabase.rpc('find_crew_by_join_token', { token: joinToken })

    if (error) throw mapDataError(error)

    const rows = (data ?? []) as CrewRow[]
    if (rows.length === 0) return null

    // El token que se busco es el que tiene: la funcion no lo devuelve, para no
    // ensenarselo a quien todavia no esta dentro, pero quien lo escribio ya lo
    // sabe.
    return toCrew({ ...rows[0], join_token: normalizeToken(joinToken) })
  }

  async create(data: NewCrew): Promise<Crew> {
    const { data: row, error } = await supabase.rpc('create_crew', {
      crew_name: data.name,
      crew_denomination: data.denomination,
    })

    if (error) throw mapDataError(error)
    if (row === null) {
      throw new AppError(AppErrorCode.UNKNOWN, 'dataAccessFailed')
    }

    return toCrew(row as CrewRow)
  }

  async update(crewId: string, data: CrewSettings): Promise<void> {
    const { error } = await supabase.from('crews').update(toCrewSettingsRow(data)).eq('id', crewId)

    if (error) throw mapDataError(error)
  }

  async rotateJoinToken(crewId: string): Promise<string> {
    const { data, error } = await supabase.rpc('rotate_join_token', { crew: crewId })

    if (error) throw mapDataError(error)
    if (typeof data !== 'string') {
      throw new AppError(AppErrorCode.UNKNOWN, 'dataAccessFailed')
    }

    return data
  }

  /**
   * TODO: sin suscripcion todavia. Ver el plan, §1.3: el tiempo real llega por
   * tabla y los equipos no estan entre las primeras. No avisar es una
   * implementacion valida del contrato.
   */
  onChange(): () => void {
    return () => undefined
  }
}

/** La misma normalizacion que aplica el servidor: sin guiones, en mayusculas. */
function normalizeToken(token: string): string {
  return token.replace(/-/g, '').trim().toUpperCase()
}
