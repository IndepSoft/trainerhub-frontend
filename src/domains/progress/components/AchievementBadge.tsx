"use client"

import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { Trophy, Star, Target, Flame, Award, Medal } from "lucide-react"
import { cn } from '@/shared/lib/utils'
import type { Achievement } from '../types/achievement.types'

interface AchievementBadgeProps {
  achievement: Achievement
  unlocked: boolean
  showProgress?: boolean
  size?: "small" | "medium" | "large"
  onClick?: () => void
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  target: Target,
  flame: Flame,
  award: Award,
  medal: Medal,
}

/**
 * Rareza del logro.
 *
 * Es una rampa con significado -comun, raro, epico, legendario-, asi que se
 * expresa como una progresion y no como cuatro colores sueltos: sube desde lo
 * neutro, pasa por Cobalt y termina en Ember. Antes iba gris, azul, morado,
 * amarillo, donde el salto de morado a amarillo no dice «mas raro», solo dice
 * «otro color».
 *
 * Que el legendario sea Ember no es casual: es el mismo naranja de la racha y de
 * la celebracion, el color que en este sistema significa logro.
 */
const RARITY_COLORS: Record<string, string> = {
  common: 'bg-ink/[0.06] border-ink/15 text-ink/60',
  rare: 'bg-cobalt-tint border-cobalt-tint-3 text-cobalt',
  epic: 'bg-cobalt-tint-2 border-cobalt/40 text-cobalt',
  legendary: 'bg-ember/12 border-ember/45 text-ember-deep',
}

/*
 * Habia tambien una tabla `categoryColors` con un color por categoria de logro.
 * Se elimina, como las de tipos de racha y de desafio: era diferenciacion
 * decorativa que el propio nombre de la categoria ya da.
 */

// TODO: la prop `showProgress` esta declarada en AchievementBadgeProps pero no se usa.
export function AchievementBadge({
  achievement,
  unlocked,
  size = "medium",
  onClick,
}: AchievementBadgeProps) {
  const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Trophy

  const sizeClasses = {
    small: "w-16 h-20 p-2",
    medium: "w-24 h-28 p-3",
    large: "w-32 h-36 p-4",
  }

  const iconSizes = {
    small: 16,
    medium: 24,
    large: 32,
  }

  return (
    <Card
      className={cn(
        "relative transition-all duration-300 cursor-pointer hover:scale-105",
        sizeClasses[size],
        unlocked ? RARITY_COLORS[achievement.rarity] : "bg-gray-50 border-gray-200 opacity-60",
        onClick && "hover:shadow-lg",
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center h-full p-0">
        <div
          className={cn(
            "rounded-full p-2 mb-2",
            // Desbloqueado o no: la diferencia la marca el contraste, no la
            // categoria. Un logro bloqueado se apaga; uno conseguido usa el
            // color estructural del sistema.
            unlocked ? 'bg-cobalt-tint-2 text-cobalt' : 'bg-ink/[0.06] text-ink/30',
          )}
        >
          <IconComponent size={iconSizes[size]} />
        </div>

        <div className="text-center">
          <h4
            className={cn(
              "font-semibold leading-tight",
              size === "small" ? "text-xs" : size === "medium" ? "text-sm" : "text-base",
            )}
          >
            {achievement.name}
          </h4>

          {size !== "small" && (
            <p className={cn("text-xs text-muted-foreground mt-1 line-clamp-2", !unlocked && "text-gray-400")}>
              {achievement.description}
            </p>
          )}
        </div>

        {unlocked && achievement.unlockedAt && (
          <Badge
            variant="secondary"
            className={cn("absolute -top-2 -right-2 text-xs", size === "small" && "text-[10px] px-1")}
          >
            +{achievement.pointsReward}
          </Badge>
        )}

        {!unlocked && (
          <div className="absolute inset-0 bg-gray-200/50 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}