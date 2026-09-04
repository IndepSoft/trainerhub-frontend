import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Routine } from '@/shared/domain/entities/routine'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface UseSchedulableRoutinesResult {
  routines: Routine[]
  loading: boolean
  error: string | null
}

/**
 * Rutinas que la agenda puede colgar de una sesión.
 *
 * Existe para que este dominio NO importe nada de `trainings`, exactamente por
 * el mismo motivo que `useSchedulableStudents`: los dos dominios leen del mismo
 * puerto, así que ven las mismas rutinas, pero ninguno depende del otro.
 *
 * Es la razón por la que `Routine` subió a `shared/domain/entities`. Antes de
 * este hook, la rutina la necesitaba un solo dominio y quedarse dentro de él era
 * lo correcto.
 */
export function useSchedulableRoutines(): UseSchedulableRoutinesResult {
  const { t } = useTranslation()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = () => {
      container.routines
        .findAll()
        .then((result) => {
          if (active) setRoutines(result)
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : t('calendar.routinesError'))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    load()
    const unsubscribe = container.routines.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [t])

  return { routines, loading, error }
}
