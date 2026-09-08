import type {
  CrewMemberProgress,
  CrewProgressRepository,
  ProgressPeriod,
} from '@/shared/domain/ports/CrewProgressRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toCrewMemberProgress, type CrewProgressRow } from './mappers'

/**
 * Implementacion de CrewProgressRepository sobre la funcion `crew_ranking`.
 *
 * SE CALCULA EN EL SERVIDOR POR RLS, no por rendimiento: el ranking necesita las
 * sesiones de todos los alumnos del equipo, y un alumno no puede leer las de los
 * demas. La funcion es `SECURITY DEFINER`, comprueba que quien pregunta
 * pertenece y que el ranking esta activado, y devuelve SOLO agregados.
 *
 * La formula de la experiencia vive en SQL y en `experience.ts`; una prueba de
 * contrato las compara.
 */
export class SupabaseCrewProgressRepository implements CrewProgressRepository {
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async ofCrew(period: ProgressPeriod): Promise<CrewMemberProgress[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []

    const { data, error } = await supabase.rpc('crew_ranking', { crew: crewId, period })

    if (error) throw mapDataError(error)
    return ((data ?? []) as CrewProgressRow[]).map(toCrewMemberProgress)
  }

  /** TODO: sin suscripcion todavia. Ver el plan, §1.3. */
  onChange(): () => void {
    return () => undefined
  }
}
