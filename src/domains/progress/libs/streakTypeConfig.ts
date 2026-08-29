import type { StreakType } from '../types/streak.types'

/**
 * Presentacion de cada tipo de racha.
 *
 * Ya no lleva color propio. Cada tipo tenia el suyo -azul, verde, morado,
 * naranja- elegidos sin criterio y ajenos al sistema: cuatro tintes
 * decorativos que competian con Cobalt y Ember sin aportar informacion, porque
 * el emoji y el nombre ya distinguen los cuatro tipos. El rediseno separa por
 * tipografia y espaciado, no por color de fondo.
 */

export const streakTypeConfig: Record<
  StreakType,
  { name: string; icon: string; description: string }
> = {
  workout: {
    name: 'Entrenamiento',
    icon: '💪',
    description: 'Días consecutivos de entrenamiento',
  },
  nutrition: {
    name: 'Nutrición',
    icon: '🥗',
    description: 'Días siguiendo el plan nutricional',
  },
  weigh_in: {
    name: 'Pesaje',
    icon: '⚖️',
    description: 'Días consecutivos registrando peso',
  },
  check_in: {
    name: 'Check-in',
    icon: '📱',
    description: 'Días consecutivos de check-in',
  },
}