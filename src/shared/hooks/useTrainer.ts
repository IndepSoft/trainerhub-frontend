import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Trainer } from '@/shared/domain/entities/trainer'
import { AppError } from '@/shared/domain/errors'

/**
 * Carga el entrenador asociado a un perfil.
 *
 * Devuelve un mensaje ya traducido, no el error del proveedor: los componentes
 * no deben conocer PostgrestError ni ningun equivalente futuro.
 */
export const useTrainer = (profileId?: string) => {
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profileId) {
      setTrainer(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    container.trainers
      .findByProfileId(profileId)
      .then((result) => {
        if (active) setTrainer(result)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(AppError.is(err) ? err.message : 'Error al cargar el entrenador')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [profileId])

  return { trainer, loading, error }
}
