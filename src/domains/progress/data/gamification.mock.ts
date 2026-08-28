import type { GamificationProfile } from '../types/gamification.types'

/**
 * Perfil de juego simulado.
 *
 * TODO: sustituir por el repositorio cuando exista el backend. La costura es
 * `useGamificationProfile`.
 */
export const gamificationProfileMock: GamificationProfile = {
  streak: {
    currentDays: 12,
    bestDays: 21,
    completedToday: true,
  },
  level: {
    level: 7,
    currentExperience: 340,
    experienceForNextLevel: 500,
  },
  milestones: [
    {
      id: 'week-1',
      title: 'Primeros pasos',
      description: 'Tres sesiones para coger el ritmo',
      state: 'completed',
      completedSessions: 3,
      requiredSessions: 3,
      experienceReward: 100,
    },
    {
      id: 'week-2',
      title: 'Constancia',
      description: 'Cuatro sesiones sin fallar una semana',
      state: 'completed',
      completedSessions: 4,
      requiredSessions: 4,
      experienceReward: 150,
    },
    {
      id: 'week-3',
      title: 'Subir la carga',
      description: 'Cinco sesiones con más intensidad',
      state: 'active',
      completedSessions: 3,
      requiredSessions: 5,
      experienceReward: 200,
    },
    {
      id: 'week-4',
      title: 'Resistencia',
      description: 'Seis sesiones y una prueba de fondo',
      state: 'locked',
      completedSessions: 0,
      requiredSessions: 6,
      experienceReward: 250,
    },
    {
      id: 'week-5',
      title: 'Meta del mes',
      description: 'Cerrar el ciclo completo',
      state: 'locked',
      completedSessions: 0,
      requiredSessions: 5,
      experienceReward: 400,
    },
  ],
}
