import { useCallback } from 'react'
import { container } from '@/app/container'
import type { SessionResult } from '@/shared/domain/entities/session'

interface UseCompleteSessionResult {
  /** La deja `completed` con lo que ocurrió. Rechaza si la base no lo admite. */
  completeSession: (sessionId: string, result: SessionResult) => Promise<void>
}

/**
 * Cerrar una sesión en vivo.
 *
 * Aparte de `useSessionToRun` porque leer y escribir son responsabilidades
 * distintas, como en `useRoutineActions`.
 *
 * NO ATRAPA EL FALLO: la pantalla tiene que esperar a que esto resuelva antes
 * de ir a la celebración, y si falla quedarse y decirlo, en vez de celebrar
 * algo que no ocurrió.
 */
export function useCompleteSession(): UseCompleteSessionResult {
  const completeSession = useCallback(
    (sessionId: string, result: SessionResult): Promise<void> =>
      container.sessions.complete(sessionId, result),
    []
  )

  return { completeSession }
}
