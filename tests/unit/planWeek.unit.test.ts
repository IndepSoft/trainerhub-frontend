import { describe, expect, it } from 'vitest'
import { summarizeWeek } from '@/domains/trainings/libs/plan.utils'
import type { PlanWeek } from '@/shared/domain/entities/plan'

/**
 * Lo que dice una semana plegada: qué días se entrena, en orden, y cuántos se
 * descansa. Es lo que distingue «lunes, miércoles y viernes» de «tres días
 * seguidos» cuando los descansos ya no se listan.
 */

function week(routineByDay: Record<number, string | null>): PlanWeek {
  return {
    number: 1,
    isDeload: false,
    days: [7, 3, 1, 5, 2, 4, 6].map((dayOfWeek) => ({
      dayOfWeek,
      routineId: routineByDay[dayOfWeek] ?? null,
    })),
  }
}

describe('el resumen de una semana de plan', () => {
  it('lista los días con rutina en orden, aunque lleguen desordenados', () => {
    const summary = summarizeWeek(week({ 5: 'rutina-1', 1: 'rutina-1', 3: 'rutina-2' }))

    expect(summary.trainingDays).toEqual([1, 3, 5])
    expect(summary.restDays).toBe(4)
  })

  it('distingue días alternos de días seguidos', () => {
    const alternos = summarizeWeek(week({ 1: 'rutina-1', 3: 'rutina-1', 5: 'rutina-1' }))
    const seguidos = summarizeWeek(week({ 1: 'rutina-1', 2: 'rutina-1', 3: 'rutina-1' }))

    expect(alternos.trainingDays).not.toEqual(seguidos.trainingDays)
    expect(alternos.restDays).toBe(seguidos.restDays)
  })

  it('una semana sin rutinas es toda descanso', () => {
    expect(summarizeWeek(week({}))).toEqual({ trainingDays: [], restDays: 7 })
  })
})
