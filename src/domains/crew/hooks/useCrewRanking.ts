import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { CrewMemberProgress, ProgressPeriod } from '@/shared/domain/ports/CrewProgressRepository'

interface UseCrewRankingResult {
  entries: CrewMemberProgress[]
  period: ProgressPeriod
  setPeriod: (period: ProgressPeriod) => void
  loading: boolean
}

/**
 * La clasificación del equipo activo.
 *
 * ARRANCA EN LA SEMANA, no en el histórico, y no es un detalle: un ranking por
 * experiencia total se congela —quien lleva dos años gana siempre— y el que
 * entra hoy deja de mirarlo a las tres semanas. Con la semana por defecto, la
 * primera vista que ve cualquiera es una que puede ganar.
 *
 * Se suscribe a las sesiones además de al ranking porque terminar una sesión
 * mueve la clasificación, y esperar a recargar la dejaría desactualizada justo
 * después del momento en el que a alguien le importa mirarla.
 */
export function useCrewRanking(): UseCrewRankingResult {
  const [period, setPeriod] = useState<ProgressPeriod>('week')
  const [entries, setEntries] = useState<CrewMemberProgress[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    setEntries(await container.crewProgress.ofCrew(period))
    setLoading(false)
  }, [period])

  useEffect(() => {
    void load()

    const unsubscribes = [
      container.crewProgress.onChange(() => void load()),
      container.sessions.onChange(() => void load()),
    ]

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [load])

  return { entries, period, setPeriod, loading }
}
