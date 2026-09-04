import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { completedBetween, completedSessions } from '@/shared/domain/experience'
import { weekBounds } from '@/shared/lib/dateKey'
import type { Session } from '@/shared/domain/entities/session'

/** Cuántas sesiones se cerraron en una franja horaria. */
export interface HourLoad {
  /** La hora de comienzo, `HH:00`. */
  hour: string
  completed: number
}

interface UseCrewActivityResult {
  completedThisWeek: number
  /** Carga por hora, de la más ocupada a la menos. Vacío sin historial. */
  byHour: HourLoad[]
  loading: boolean
}

/**
 * Cuánto se entrena en el equipo, y a qué horas.
 *
 * LA PREGUNTA DE NEGOCIO ES SI CABE MÁS GENTE. Un entrenador con la tarde llena
 * y la mañana vacía no necesita más alumnos: necesita moverlos de hora, o dejar
 * de vender la franja que ya no da más. Eso no se ve en un total mensual.
 *
 * Se agrupa por HORA DE COMIENZO y no por día de la semana porque el cuello de
 * botella de un gimnasio pequeño es el horario, no el calendario: los martes no
 * se llenan, las siete de la tarde sí.
 *
 * Se cuenta sobre sesiones CERRADAS, no agendadas: lo que mide la ocupación real
 * es quién vino, no quién estaba apuntado.
 */
export function useCrewActivity(): UseCrewActivityResult {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    setSessions(await container.sessions.findAll())
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    return container.sessions.onChange(() => {
      void load()
    })
  }, [load])

  const week = weekBounds(new Date())
  const completedThisWeek = completedBetween(sessions, week.from, week.to).length

  const loadByHour = new Map<string, number>()
  for (const session of completedSessions(sessions)) {
    // La hora de comienzo, sin los minutos: agrupar por `18:30` y `18:00` por
    // separado partiría la misma franja en dos.
    const hour = `${session.time.slice(0, 2)}:00`
    loadByHour.set(hour, (loadByHour.get(hour) ?? 0) + 1)
  }

  const byHour = [...loadByHour.entries()]
    .map(([hour, completed]) => ({ hour, completed }))
    .sort((left, right) => right.completed - left.completed)

  return { completedThisWeek, byHour, loading }
}
