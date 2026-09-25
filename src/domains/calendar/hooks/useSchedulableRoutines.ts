import { container } from '@/app/container'
import { crewScope } from '@/app/crewScope'
import { useCachedQuery } from '@/shared/hooks/useCachedQuery'
import type { Routine } from '@/shared/domain/entities/routine'

interface UseSchedulableRoutinesResult {
  routines: Routine[]
  loading: boolean
  error: string | null
}

/** Referencia estable para el «todavía nada». */
const NONE: Routine[] = []

/**
 * Rutinas que la agenda puede colgar de una sesión.
 *
 * Existe para que este dominio NO importe nada de `trainings`, exactamente por
 * el mismo motivo que `useSchedulableStudents`: los dos dominios leen del mismo
 * puerto, así que ven las mismas rutinas, pero ninguno depende del otro.
 *
 * Es la razón por la que `Routine` subió a `shared/domain/entities`. Antes de
 * este hook, la rutina la necesitaba un solo dominio y quedarse dentro de él era
 * lo correcto.
 */
export function useSchedulableRoutines(): UseSchedulableRoutinesResult {
  const { data, loading, error } = useCachedQuery<Routine[]>({
    // El equipo activo, en la clave: lo de un equipo no responde por otro.
    key: ['routines', crewScope.current()],
    load: () => container.routines.findAll(),
    subscribe: (reload) => container.routines.onChange(reload),
    initial: NONE,
    errorKey: 'calendar.routinesError',
  })

  return { routines: data, loading, error }
}
