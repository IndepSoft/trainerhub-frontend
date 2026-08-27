import type { StreakType } from '../types/streak.types';

export const streakTypeConfig: Record<
  StreakType,
  { name: string; icon: string; color: string; bgColor: string; description: string }
> = {
  workout: {
    name: 'Entrenamiento',
    icon: '💪',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Días consecutivos de entrenamiento',
  },
  nutrition: {
    name: 'Nutrición',
    icon: '🥗',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Días siguiendo el plan nutricional',
  },
  weigh_in: {
    name: 'Pesaje',
    icon: '⚖️',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Días consecutivos registrando peso',
  },
  check_in: {
    name: 'Check-in',
    icon: '📱',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Días consecutivos de check-in',
  },
}