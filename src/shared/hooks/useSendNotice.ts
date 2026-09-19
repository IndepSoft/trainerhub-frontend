import { useCallback } from 'react'
import { container } from '@/app/container'
import type { NewNotice } from '@/shared/domain/ports/NoticeRepository'

interface UseSendNoticeResult {
  /** Deja el aviso en la bandeja del alumno. Rechaza si la base no lo admite. */
  sendNotice: (notice: NewNotice) => Promise<void>
}

/**
 * Mandarle un aviso privado a un alumno.
 *
 * Vive en `shared` porque avisan TRES dominios —el recordatorio de la agenda,
 * la cola de cobros y la cuota en la ficha— y la agenda no importa nada de
 * `students` a propósito: es lo que `useSchedulableStudents` dejó escrito.
 *
 * NO ATRAPA EL FALLO. El aviso de éxito y el de error los pinta quien pulsó
 * —`NoticeDialog`, la ficha de la sesión—, y sólo después de que esto
 * resuelva: un aviso celebrado antes de escribir es el defecto que se quitó
 * de la agenda.
 */
export function useSendNotice(): UseSendNoticeResult {
  const sendNotice = useCallback(async (notice: NewNotice): Promise<void> => {
    await container.notices.send(notice)
  }, [])

  return { sendNotice }
}
