import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Routine } from '@/shared/domain/entities/routine'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface UseAssignableRoutinesResult {
  routines: Routine[]
  loading: boolean
  error: string | null
}

/**
 * Rutinas que se le pueden asignar a un alumno al agendarle una sesión.
 *
 * Tercer hermano de `useSchedulableStudents` y `useSchedulableRoutines`: cada
 * dominio tiene el suyo sobre el mismo puerto, y así ninguno importa del otro
 * aunque los tres vean exactamente lo mismo.
 */
export function useAssignableRoutines(): UseAssignableRoutinesResult {
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
          if (active) setError(cause instanceof Error ? cause.message : t('students.routinesError'))
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
