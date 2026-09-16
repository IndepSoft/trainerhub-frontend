import { useCallback } from 'react'
import { container } from '@/app/container'

interface UseLeaveCrewResult {
  /** Da de baja la propia ficha. Rechaza si la base no lo admite. */
  leaveCrew: (ownStudentId: string) => Promise<void>
}

/**
 * Salir del equipo en el que uno entrena.
 *
 * Es la misma baja que da el entrenador —`deactivate`, que cancela lo que
 * quedaba por venir—, sobre la propia ficha; la base lo permite sólo a quien
 * está dentro. No se toma `useStudentEditor`: es la herramienta de quien
 * gestiona el padrón, vive en `students`, y Configuración no importa de
 * ningún otro dominio.
 */
export function useLeaveCrew(): UseLeaveCrewResult {
  const leaveCrew = useCallback(
    (ownStudentId: string): Promise<void> => container.students.deactivate(ownStudentId),
    []
  )

  return { leaveCrew }
}
