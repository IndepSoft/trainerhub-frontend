import { useCallback } from 'react'
import { container } from '@/app/container'
import { findOverlappingSessions, type ProposedSlot } from '@/shared/domain/sessionScheduling'
import type { Session } from '@/shared/domain/entities/session'
import type { NewSession } from '@/shared/domain/ports/SessionRepository'

interface UseSessionSchedulingResult {
  /**
   * Con qué choca el hueco, releído del puerto. Vacío si está libre.
   *
   * `ignoreSessionId` es la sesión que se está moviendo: ocupa su propio hueco
   * y no cuenta como choque.
   */
  findConflicts: (slot: ProposedSlot, ignoreSessionId?: string) => Promise<Session[]>
  createSession: (data: NewSession) => Promise<void>
  updateSession: (sessionId: string, data: NewSession) => Promise<void>
}

/**
 * Agendar y reprogramar una sesión desde un formulario.
 *
 * Vive en `shared` porque agendan dos dominios —la agenda y la ficha del
 * alumno— con el mismo tronco de campos, y ninguno importa del otro.
 *
 * EL CHOQUE SE RELEE AL ENVIAR y no se calcula sobre lo que el formulario
 * cargó al elegir el día: entre elegir la hora y pulsar puede haberse agendado
 * algo, y la lista se cargó con la duración de entonces. Estaba escrito igual
 * en los dos formularios; ahora la comprobación que vale es una sola.
 *
 * Las escrituras NO atrapan el fallo: el formulario lo dice donde se pulsó y
 * no cierra, y el aviso de éxito va después de que esto resuelva.
 */
export function useSessionScheduling(): UseSessionSchedulingResult {
  const findConflicts = useCallback(
    async (slot: ProposedSlot, ignoreSessionId?: string): Promise<Session[]> => {
      const sameDay = await container.sessions.findByDate(slot.date)
      return findOverlappingSessions(sameDay, slot, { ignoreSessionId })
    },
    []
  )

  const createSession = useCallback(async (data: NewSession): Promise<void> => {
    await container.sessions.create(data)
  }, [])

  const updateSession = useCallback(
    (sessionId: string, data: NewSession): Promise<void> =>
      container.sessions.update(sessionId, data),
    []
  )

  return { findConflicts, createSession, updateSession }
}
