import { Target, Trophy, Users } from 'lucide-react'
import type { ProgressOverview, ProgressStat } from '../types/progress.types'

/**
 * Contadores del resumen de progreso.
 *
 * Se cayeron dos que estaban duplicados en la misma pantalla: «Rachas Activas»
 * lo dice ya la llama de la cabecera, y «Puntos Totales» competia con la barra
 * de XP como si fueran dos sistemas de puntos distintos. Se decidio que solo
 * hay uno, XP, asi que este se elimina en vez de traducirse.
 *
 * TODO: sustituir por el repositorio cuando exista el backend. La costura es
 * `useProgressOverview`.
 */
const STATS: ProgressStat[] = [
  { id: 'achievements', icon: Trophy, label: 'Logros activos', value: 12 },
  { id: 'challenges', icon: Target, label: 'Desafíos activos', value: 5 },
  { id: 'participation', icon: Users, label: 'Participación', value: '87%' },
]

export const progressOverviewMock: ProgressOverview = {
  stats: STATS,
}
