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
}

export function useDashboardSummary(): UseDashboardSummaryResult {
  return {
    summary: dashboardSummaryMock,
    loading: false,
    error: null,
  }
}
