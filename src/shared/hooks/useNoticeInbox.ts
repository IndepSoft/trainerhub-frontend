import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Notice } from '@/shared/domain/entities/notice'

interface UseNoticeInboxResult {
  /** Los avisos de la ficha, del más nuevo al más viejo. Vacío sin ficha. */
  notices: Notice[]
  /** Apaga el contador. No hace nada sin ficha. */
  markAllRead: () => Promise<void>
}

/**
 * La bandeja de avisos de una ficha de alumno, viva.
 *
 * `studentId` indefinido es quien no entrena en el equipo activo: un
 * entrenador manda avisos, no los recibe, y su bandeja está vacía en vez de
 * preguntar por una ficha que no tiene.
 *
 * Vive en `shared` porque la pinta la campana, que es de la navegación
 * compartida y no puede importar de un dominio.
 */
export function useNoticeInbox(studentId: string | undefined): UseNoticeInboxResult {
  const [notices, setNotices] = useState<Notice[]>([])

  const load = useCallback(async (): Promise<void> => {
    if (studentId === undefined) {
      setNotices([])
      return
    }
    setNotices(await container.notices.findForStudent(studentId))
  }, [studentId])

  useEffect(() => {
    void load()
    return container.notices.onChange(() => {
      void load()
    })
  }, [load])

  const markAllRead = useCallback(async (): Promise<void> => {
    if (studentId === undefined) return
    await container.notices.markAllRead(studentId)
  }, [studentId])

  return { notices, markAllRead }
}
