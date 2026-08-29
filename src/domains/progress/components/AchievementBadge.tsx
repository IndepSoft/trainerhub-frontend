import { Award, Flame, Lock, Medal, Star, Target, Trophy } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Achievement } from '../types/achievement.types'

export type AchievementPlateSize = 'small' | 'medium' | 'large'

interface AchievementBadgeProps {
  achievement: Achievement
  unlocked: boolean
  size?: AchievementPlateSize
  onClick?: () => void
}

const ICONS = {
  trophy: Trophy,
  star: Star,
  target: Target,
  flame: Flame,
  award: Award,
  medal: Medal,
}

/**
 * Acabado de la placa según su rareza.
 *
 * Es una progresión, no cuatro colores sueltos: sube desde el hueso, atraviesa
 * Cobalt hasta llenarlo, y culmina en una placa de Ink con canto Ember. Que el
 * legendario sea Ember no es casual: es el naranja de la racha y de la
 * celebración, el color que en este sistema significa logro.
 *
 * `epic` pasa a relleno sólido a propósito: el salto de tinte a sólido es lo que
 * hace visible el escalón sin necesidad de introducir otro tono.
 */
const PLATE_FINISH: Record<string, string> = {
  common: 'bg-bone border-ink/20 text-ink',
  rare: 'bg-cobalt-tint-2 border-cobalt/35 text-cobalt',
  epic: 'bg-cobalt border-cobalt text-white',
  legendary: 'bg-ink border-ember text-ember',
}

/**
 * El ancho es fluido con tope, no fijo.
 *
 * Con ancho fijo dentro de una rejilla mas ancha, las placas se pegaban al borde
 * izquierdo de su celda y los huecos entre columnas salian desiguales. Llenan la
 * celda hasta el tope y se centran.
 */
const PLATE_SIZES: Record<AchievementPlateSize, string> = {
  small: 'w-full max-w-[86px] py-3 px-2 gap-1.5',
  medium: 'w-full max-w-[112px] py-4 px-2.5 gap-2',
  large: 'w-full max-w-[136px] py-5 px-3 gap-2.5',
}

const ICON_SIZES: Record<AchievementPlateSize, number> = {
  small: 20,
  medium: 26,
  large: 32,
}

/**
 * Las esquinas cortadas son la firma de la placa.
 *
 * Se cortan dos esquinas opuestas y no las cuatro: con las cuatro el resultado
 * es un octógono, que se lee como una forma geométrica; con dos, se lee como una
 * pieza troquelada. Un `border-radius` la habría dejado en la tarjeta redondeada
 * de siempre, que es justo lo que se quería evitar.
 */
const NOTCHED_PLATE =
  'polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px)'

/**
 * Un logro, como placa conmemorativa.
 *
 * Una placa bloqueada no se tapa con un velo gris: se muestra SIN GRABAR, con el
 * canto discontinuo y un candado donde iría el símbolo. La metáfora hace el
 * trabajo que antes hacía una capa de opacidad encima, y además deja legible el
 * nombre de lo que queda por conseguir, que es lo que motiva.
 */
export function AchievementBadge({
  achievement,
  unlocked,
  size = 'medium',
  onClick,
}: AchievementBadgeProps) {
  const Icon = ICONS[achievement.icon as keyof typeof ICONS] ?? Trophy
  const isInteractive = onClick !== undefined

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isInteractive}
      aria-label={
        unlocked
          ? `${achievement.name}. Conseguido. ${achievement.pointsReward} XP`
          : `${achievement.name}. Bloqueado`
      }
      className={cn(
        'mx-auto flex flex-col items-center border-2 text-center transition-colors',
        PLATE_SIZES[size],
        unlocked
          ? PLATE_FINISH[achievement.rarity]
          : 'border-dashed border-ink/20 bg-transparent text-ink/30',
        // Sin `hover:scale`: agrandar al pasar por encima es el efecto por
        // defecto de cualquier plantilla. El canto se aviva, que es como
        // responde una pieza de metal a la luz.
        isInteractive && unlocked && 'hover:border-ember',
        isInteractive && 'cursor-pointer disabled:cursor-default'
      )}
      style={{ clipPath: NOTCHED_PLATE }}
    >
      {unlocked ? (
        <Icon size={ICON_SIZES[size]} strokeWidth={1.75} />
      ) : (
        <Lock size={ICON_SIZES[size] - 6} strokeWidth={2} />
      )}

      <span
        className={cn(
          'font-display font-bold uppercase leading-[1.05] tracking-[0.06em]',
          size === 'small' ? 'text-[11px]' : size === 'medium' ? 'text-xs' : 'text-sm'
        )}
      >
        {achievement.name}
      </span>

      {unlocked && (
        <>
          {/* Regla de canto a canto: es el grabado que separa el nombre de la
              recompensa, y sustituye a la insignia flotante de antes. */}
          <span aria-hidden="true" className="h-px w-6 bg-current opacity-40" />
          <span className="metric-figures text-[10px] font-bold tracking-wider">
            {achievement.pointsReward} XP
          </span>
        </>
      )}
    </button>
  )
}
