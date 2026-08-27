import { progressOverviewMock } from '../data/progressOverview.mock'
import type { ProgressOverview } from '../types/progress.types'

interface UseProgressOverviewResult {
  overview: ProgressOverview
  loading: boolean
  error: string | null
}

/**
 * Unica fuente de datos del resumen de progreso.
 *
 * Misma costura que en el resto de dominios: cuando llegue el backend, este
 * hook pasara a llamar al puerto via `container` y ni la pagina ni los
 * componentes se enteraran.
 */
export function useProgressOverview(): UseProgressOverviewResult {
  return {
    overview: progressOverviewMock,
    loading: false,
    error: null,
  }
}
