import { useCallback, useState } from 'react'
import { dashboardSummaryMock } from '../data/dashboardSummary.mock'
import type { DashboardSummary } from '../types/dashboard.types'

/**
 * Única fuente de datos del dashboard.
 *
 * Existe para concentrar en un punto la responsabilidad que antes estaba
 * repartida entre tres componentes de presentación. Cuando llegue el backend,
 * este hook pasará a llamar al puerto correspondiente vía `container` y ni la
 * página ni los componentes se enterarán: ese es justo el motivo de que la
 * costura esté aquí y no dentro de la vista.
 *
 * Devuelve `loading` desde ya, aunque hoy sea siempre `false`, para que los
 * consumidores contemplen el estado de carga desde el principio y añadirlo
 * después no obligue a tocarlos.
 */
interface UseDashboardSummaryResult {
  summary: DashboardSummary
  loading: boolean
  error: string | null
  /** Vuelve a pedir los datos. La usa el gesto de tirar para recargar. */
  refresh: () => Promise<void>
}

export function useDashboardSummary(): UseDashboardSummaryResult {
  const [summary, setSummary] = useState<DashboardSummary>(dashboardSummaryMock)
  const [loading, setLoading] = useState(false)

  /*
   * Hoy vuelve a leer el mismo mock, asi que el contenido no cambia: no puede
   * cambiar sin backend. Lo que si es real es el CAMINO -estado de carga,
   * espera, sustitucion de datos- y el punto donde se enchufara la llamada al
   * puerto. Se deja la espera artificial a proposito y comentada: sin ella el
   * gesto termina en el mismo fotograma y no se puede comprobar que el
   * indicador de recarga funciona.
   *
   * TODO: sustituir por la llamada al repositorio cuando exista.
   */
  const refresh = useCallback(async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 450))
    setSummary(dashboardSummaryMock)
    setLoading(false)
  }, [])

  return { summary, loading, error: null, refresh }
}
