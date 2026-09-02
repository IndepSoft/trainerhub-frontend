import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { levelFromExperience } from '@/domains/progress/libs/progressRules'
import type { LevelProgress } from '@/domains/progress/types/gamification.types'

/** Lo que se enseña de un alumno en su tarjeta. */
export interface StudentProgress {
  level: LevelProgress
  experience: number
  completedSessions: number
}

interface UseStudentsProgressResult {
  /** Por identificador de alumno. Sin entrada = todavía no ha entrenado. */
  progressById: Map<string, StudentProgress>
  loading: boolean
}

/**
 * El progreso de todos los alumnos del crew, de una vez.
 *
 * UNA SOLA CONSULTA PARA TODA LA LISTA, no una por tarjeta. Con veinte alumnos,
 * pedir el historial de cada uno son veinte viajes de red en cuanto haya
 * servidor —el N+1 clásico—, y aquí no hace falta ninguno: el esfuerzo agregado
 * del equipo ya se calcula para el ranking, y es exactamente el mismo dato.
 *
 * Por eso el puerto dejó de llamarse `RankingRepository`: lo que devuelve es
 * cuánto ha entrenado cada miembro, y ordenar es sólo una de las cosas que se
 * hacen con eso.
 *
 * El NIVEL se deriva aquí y no viaja en el agregado: es una regla de producto
 * —cuánto cuesta cada nivel— que puede cambiar sin tocar lo que el servidor
 * cuenta. Lo que se guarda es el esfuerzo; lo que se interpreta, el nivel.
 */
export function useStudentsProgress(): UseStudentsProgressResult {
  const [progressById, setProgressById] = useState<Map<string, StudentProgress>>(new Map())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    // `all` y no la semana: en una ficha lo que importa es lo acumulado, no
    // quién va ganando este lunes.
    const entries = await container.crewProgress.ofCrew('all')

    setProgressById(
      new Map(
        entries.map((entry) => [
          entry.studentId,
          {
            level: levelFromExperience(entry.experience),
            experience: entry.experience,
            completedSessions: entry.completedSessions,
          },
        ])
      )
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()

    // A las sesiones también: cerrar una cambia el nivel de quien la hizo, y la
    // lista tiene que enterarse sin recargar.
    const unsubscribes = [
      container.crewProgress.onChange(() => void load()),
      container.sessions.onChange(() => void load()),
    ]

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [load])

  return { progressById, loading }
}
