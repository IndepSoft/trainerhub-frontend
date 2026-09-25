import { container } from '@/app/container'
import { crewScope } from '@/app/crewScope'
import { useCachedQuery } from '@/shared/hooks/useCachedQuery'
import type { Routine } from '@/shared/domain/entities/routine'

interface UseAssignableRoutinesResult {
  routines: Routine[]
  loading: boolean
  error: string | null
}

/** Referencia estable para el «todavía nada». */
const NONE: Routine[] = []

/**
 * Rutinas que se le pueden asignar a un alumno al agendarle una sesión.
 *
 * Tercer hermano de `useSchedulableStudents` y `useSchedulableRoutines`: cada
 * dominio tiene el suyo sobre el mismo puerto, y así ninguno importa del otro
 * aunque los tres vean exactamente lo mismo.
 */
export function useAssignableRoutines(): UseAssignableRoutinesResult {
  const { data, loading, error } = useCachedQuery<Routine[]>({
    // El equipo activo, en la clave: lo de un equipo no responde por otro.
    key: ['routines', crewScope.current()],
    load: () => container.routines.findAll(),
    subscribe: (reload) => container.routines.onChange(reload),
    initial: NONE,
    errorKey: 'students.routinesError',
  })

  return { routines: data, loading, error }
}
