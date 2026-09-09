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

  /**
   * Sin canal propio, y esta vez por una razon y no por un pendiente: el
   * ranking NO TIENE TABLA. Sale de `crew_ranking`, que agrega sesiones al
   * vuelo, asi que lo que lo mueve es exactamente lo que mueve a `sessions`.
   *
   * Sus dos consumidores -`useCrewRanking` y `useStudentsProgress`- ya escuchan
   * ademas a `container.sessions`, que si tiene canal. Abrir aqui un segundo
   * canal sobre la misma tabla les haria recargar dos veces por cada serie
   * anotada.
   */
  onChange(): () => void {
    return () => undefined
  }
}
