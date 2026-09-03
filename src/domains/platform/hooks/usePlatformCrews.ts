import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { AppError } from '@/shared/domain/errors'
import type { CrewOverview } from '@/shared/domain/ports/PlatformRepository'
import type { SubscriptionStatus } from '@/shared/domain/entities/crew'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface UsePlatformCrewsResult {
  crews: CrewOverview[]
  loading: boolean
  error: string | null
  setSubscription: (crewId: string, status: SubscriptionStatus) => Promise<void>
}

/**
 * Los equipos de la plataforma, con su suscripción.
 *
 * Es el único hook de la aplicación que mira por encima de un crew, y por eso
 * habla con `container.platform` y no con `container.crews`: el puerto de crews
 * promete operaciones acotadas, y esto no lo está.
 *
 * Se suscribe a los cambios porque activar una suscripción tiene que verse en la
 * misma lista sin recargar —es la acción principal de la pantalla— y porque
 * crear un crew desde otra pestaña debería aparecer aquí.
 */
export function usePlatformCrews(): UsePlatformCrewsResult {
  const { t } = useTranslation()
  const [crews, setCrews] = useState<CrewOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    try {
      setCrews(await container.platform.listCrews())
    } catch (caught) {
      setError(AppError.is(caught) ? caught.message : t('platform.crews.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()

    const unsubscribes = [
      container.platform.onChange(() => void load()),
      // También a los crews: uno recién creado tiene que aparecer aquí, y es
      // justo el que espera activación.
      container.crews.onChange(() => void load()),
    ]

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [load])

  const setSubscription = useCallback(async (crewId: string, status: SubscriptionStatus) => {
    await container.platform.setSubscription(crewId, status)
  }, [])

  return { crews, loading, error, setSubscription }
}
