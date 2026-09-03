import { useMemo } from 'react'
import { Flame, Target, Trophy } from 'lucide-react'
import { unlockedAchievements } from '../libs/achievementEvaluation'
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
 */
export function useProgressOverview(
  achievements: Achievement[],
  completedCount: number
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
        { id: 'sessions', icon: Flame, label: t('progress.stat.sessions'), value: completedCount },
        {
          id: 'experience',
          icon: Target,
          label: t('progress.stat.experience'),
          // La suma de lo que dan los logros ya conseguidos. Es un número
          // distinto del nivel —el nivel sale de las series— y por eso se
          // etiqueta aparte: dos cifras llamadas «XP» a media pantalla una de
          // otra harían pensar que una de las dos está mal.
          value: unlockedAchievements(achievements).reduce(
            (total, achievement) => total + achievement.pointsReward,
            0
          ),
        },
      ],
    }
  }, [achievements, completedCount, t])

  return { overview }
}
