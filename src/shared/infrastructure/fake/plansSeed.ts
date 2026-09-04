import type { TrainingPlan } from '@/shared/domain/entities/plan'
import { DEV_CREW_ID } from './crewsSeed'

/**
 * Planes simulados.
 *
 * Un plan es un mesociclo: varias semanas hacia un objetivo. Las semanas son
 * microciclos, y cada día apunta a una rutina o a nada, que es descanso.
 *
 * Vive junto a `FakePlanRepository` por el mismo motivo que las otras semillas:
 * los datos de prueba de una entidad compartida pertenecen a su implementacion
 * falsa.
 *
 * TODO: sustituir por el adaptador real cuando exista el esquema.
 */
export const plansSeed: TrainingPlan[] = [
  {
    id: 'plan-1',
    crewId: DEV_CREW_ID,
    title: 'Base de fuerza · 4 semanas',
    description: 'Adaptación anatómica y técnica antes de subir cargas.',
    objectiveId: 'acondicionamiento',
    splitId: 'full-body',
    weeklyFrequency: 3,
    level: 'Principiante',
    weeks: [1, 2, 3].map((number) => ({
      number,
      isDeload: false,
      days: [
        { dayOfWeek: 1, routineId: 'routine-1' },
        { dayOfWeek: 2, routineId: null },
        { dayOfWeek: 3, routineId: 'routine-1' },
        { dayOfWeek: 4, routineId: null },
        { dayOfWeek: 5, routineId: 'routine-1' },
        { dayOfWeek: 6, routineId: null },
        { dayOfWeek: 7, routineId: null },
      ],
    })).concat([
      {
        // Cuarta semana de descarga: menos volumen para asimilar lo acumulado.
        number: 4,
        isDeload: true,
        days: [
          { dayOfWeek: 1, routineId: 'routine-1' },
          { dayOfWeek: 2, routineId: null },
          { dayOfWeek: 3, routineId: null },
          { dayOfWeek: 4, routineId: 'routine-1' },
          { dayOfWeek: 5, routineId: null },
          { dayOfWeek: 6, routineId: null },
          { dayOfWeek: 7, routineId: null },
        ],
      },
    ]),
  },
]
