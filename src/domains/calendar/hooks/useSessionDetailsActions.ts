import { useCallback } from 'react'
import { container } from '@/app/container'
import type { Session, SessionDetailsChanges } from '../types/calendar.types'

interface UseSessionDetailsActionsResult {
  /** Estado y notas, encima de la sesión tal como está. Rechaza si la base no lo admite. */
  saveDetails: (session: Session, changes: SessionDetailsChanges) => Promise<void>
  removeSession: (sessionId: string) => Promise<void>
}

/**
 * Lo que la ficha de una sesión escribe sin abrir el formulario.
 *
 * No es `useSessionScheduling`: aquel reprograma con TODOS los campos que el
 * formulario acaba de pedir; esto cambia dos y conserva el resto tal cual.
 *
 * Una sola escritura con la sesión entera y lo cambiado encima. `update` pide
 * la sesión completa —es lo que el formulario de edición manda—, y
 * reutilizarlo evita un método del puerto sólo para las notas.
 *
 * Nada se atrapa aquí: la ficha dice el fallo donde se pulsó y avisa del
 * éxito después de que esto resuelva.
 */
export function useSessionDetailsActions(): UseSessionDetailsActionsResult {
  const saveDetails = useCallback(
    (session: Session, changes: SessionDetailsChanges): Promise<void> => {
      const { id: sessionId, crewId: _crewId, ...current } = session
      return container.sessions.update(sessionId, { ...current, ...changes })
    },
    []
  )

  const removeSession = useCallback(
    (sessionId: string): Promise<void> => container.sessions.remove(sessionId),
    []
  )

  return { saveDetails, removeSession }
}
