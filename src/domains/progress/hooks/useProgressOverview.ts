import { useMemo } from 'react'
import { Target, Trophy } from 'lucide-react'
import { unlockedAchievements } from '../libs/badges'
import type { Achievement } from '../types/achievement.types'
import type { ProgressOverview } from '../types/progress.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface UseProgressOverviewResult {
  overview: ProgressOverview
}

/**
 * Los tres contadores del resumen, derivados de lo que ya se ha calculado.
 *
 * LOS TRES ESTABAN ESCRITOS A MANO: «Logros activos 12», «Desafíos activos 5»,
 * «Participación 87 %». Ninguno cambiaba, y el de desafíos hablaba de un sistema
 * que no existe.
 *
 * «Desafíos» se ELIMINA en vez de arreglarse, igual que se hizo con el indicador
 * de ingresos del panel: no hay fuente, y una cifra inventada en un resumen es
 * peor que un hueco. Su sitio lo ocupa la constancia, que sí se puede medir.
 *
 * No recibe sesiones ni las vuelve a pedir: toma lo ya calculado por
 * `useGamificationProfile`. Volver a leerlas aquí significaría dos consultas
 * para lo mismo y dos oportunidades de discrepar.
 *
 * QUEDAN DOS, y eran tres: el recuento de sesiones se fue al historial, que es
 * la sección que lo explica —cuántas, cuáles y de qué mes—. La misma cifra en
 * dos secciones de la misma pantalla es una cifra que algún día discrepará de
 * sí misma.
 */
export function useProgressOverview(
  achievements: Achievement[],
  totalPoints: number
): UseProgressOverviewResult {
  const { t } = useTranslation()
  const overview = useMemo<ProgressOverview>(() => {
    const unlocked = unlockedAchievements(achievements).length

    return {
      stats: [
        {
          id: 'achievements',
          icon: Trophy,
          label: t('progress.stat.achievements'),
          value: `${unlocked}/${achievements.length}`,
        },
        {
          id: 'points',
          icon: Target,
          label: t('progress.stat.points'),
          // La suma de puntos de todas las sesiones, tal y como la calculó el
          // servidor. Es la misma cifra de la que sale el nivel: una sola.
          value: totalPoints,
        },
      ],
    }
  }, [achievements, totalPoints, t])

  return { overview }
}
