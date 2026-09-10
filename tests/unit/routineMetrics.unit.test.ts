import { describe, expect, it } from 'vitest'
import { plannedWeekVolume } from '@/shared/domain/routineMetrics'
import type { Routine } from '@/shared/domain/entities/routine'
import type { TrainingPlan } from '@/shared/domain/entities/plan'

function routine(id: string, sets: number): Routine {
  return {
    id,
    crewId: 'crew-1',
    title: id,
    description: '',
    level: 'Principiante',
    blocks: [
      {
        id: `${id}-block`,
        method: 'simple',
        restAfterSeconds: 0,
        exercises: [
          { id: `${id}-press`, exerciseId: 'press', sets, reps: '8', restSeconds: 60 },
        ],
      },
    ],
  }
}

const plan: TrainingPlan = {
  id: 'plan-1',
  crewId: 'crew-1',
  title: 'Base',
  description: '',
  objectiveId: 'fuerza',
  splitId: 'full-body',
  weeklyFrequency: 3,
  level: 'Principiante',
  weeks: [
    {
      number: 1,
      isDeload: false,
      days: [
        { dayOfWeek: 1, routineId: 'a' },
        { dayOfWeek: 2, routineId: null },
        { dayOfWeek: 3, routineId: 'b' },
        { dayOfWeek: 5, routineId: 'borrada' },
      ],
    },
  ],
}

describe('plannedWeekVolume: lo que la semana programa', () => {
  const routines = new Map<string, Routine>([
    ['a', routine('a', 4)],
    ['b', routine('b', 3)],
  ])

  it('suma sesiones, series y minutos de los dias con rutina', () => {
    const volume = plannedWeekVolume(plan, 1, routines)
    expect(volume.sessions).toBe(3)
    expect(volume.sets).toBe(7)
    expect(volume.minutes).toBeGreaterThan(0)
  })

  it('una rutina borrada sigue siendo un dia de entrenamiento, sin series', () => {
    const onlyA = new Map<string, Routine>([['a', routine('a', 4)]])
    expect(plannedWeekVolume(plan, 1, onlyA)).toMatchObject({ sessions: 3, sets: 4 })
  })

  it('una semana que no existe no programa nada', () => {
    expect(plannedWeekVolume(plan, 9, routines)).toEqual({ sessions: 0, sets: 0, minutes: 0 })
  })
})
