import { Flame } from 'lucide-react'
import { Progress } from '@/shared/ui/progress'
import { useCountUp } from '@/shared/hooks/useCountUp'
import { cn } from '@/shared/lib/utils'
import type { LevelProgress, StreakStatus } from '../types/gamification.types'

interface GamificationHeaderProps {
  streak: StreakStatus
  level: LevelProgress
  levelCompletion: number
  experienceToNextLevel: number
}

/**
 * Racha y nivel, siempre visibles.
 *
 * El brief pide que la racha no se esconda nunca: es el gancho de todo el
 * registro. Va pegada arriba con `sticky`, así que sobrevive al desplazamiento
 * del sendero.
 *
 * Ember se reserva aquí para la llama de la racha: es el dato con más carga
 * emocional de la pantalla y el único que merece el naranja. El nivel y su barra
 * van en Cobalt, que es lo estructural.
 */
export function GamificationHeader({
  streak,
  level,
  levelCompletion,
  experienceToNextLevel,
}: GamificationHeaderProps) {
  const animatedStreak = useCountUp({ target: streak.currentDays })
  const animatedExperience = useCountUp({ target: level.currentExperience })

  return (
    <div className="sticky top-0 z-20 border-b border-cobalt-tint-3 bg-bone/95 px-5 py-4 backdrop-blur">
      <div className="flex items-center gap-5">
        <div className="flex shrink-0 items-center gap-2">
          <Flame
            className={cn(
              'size-6',
              // Una racha cumplida hoy arde; una pendiente se muestra apagada,
              // que es la senal de que hay algo que hacer antes de que acabe el dia.
              streak.completedToday ? 'text-ember' : 'text-ink/25'
            )}
            strokeWidth={2.25}
            fill={streak.completedToday ? 'currentColor' : 'none'}
          />
          <span className="metric-figures font-display text-3xl font-extrabold leading-none text-ink">
            {Math.round(animatedStreak)}
          </span>
          <span className="sr-only">días de racha</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
              Nivel {level.level}
            </span>
            <span className="metric-figures text-[11px] font-semibold text-ink/40">
              {Math.round(animatedExperience)} / {level.experienceForNextLevel} XP
            </span>
          </div>

          <Progress
            value={levelCompletion * 100}
            className="h-2 bg-cobalt-tint-2 [&>[data-slot=progress-indicator]]:bg-cobalt"
          />

          <p className="mt-1.5 text-[11px] text-ink/40">
            Faltan <span className="metric-figures font-semibold text-ink/60">{experienceToNextLevel}</span> XP
            para el nivel {level.level + 1}
          </p>
        </div>
      </div>
    </div>
  )
}
