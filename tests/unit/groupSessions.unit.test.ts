import { describe, expect, it } from 'vitest'
import { groupSessions } from '@/domains/students/libs/groupSessions'
import type { Session } from '@/shared/domain/entities/session'

/**
 * Las sesiones de la ficha: lo próximo arriba y en orden de llegada, lo pasado
 * por meses y del más reciente al más antiguo. Una abierta de un día pasado no
 * ocurrió, y va con lo pasado.
 */

function session(id: string, status: Session['status'], date: string, time = '09:00'): Session {
  return {
    id,
    crewId: 'crew-1',
    title: 'Sesion',
    studentId: 'student-1',
    kind: 'individual',
    modality: 'strength',
    category: '',
    date,
    time,
    durationMinutes: 60,
    location: '',
    status,
    notes: '',
    routineId: null,
    result: null,
  }
}

describe('las sesiones agrupadas de una ficha', () => {
  const today = '2026-09-16'

  it('pone lo por venir primero, de lo más cercano a lo más lejano', () => {
    const { upcoming } = groupSessions(
      [
        session('lejos', 'confirmed', '2026-09-20'),
        session('hoy-tarde', 'pending', today, '18:00'),
        session('hoy-pronto', 'confirmed', today, '08:00'),
      ],
      today
    )

    expect(upcoming.map((entry) => entry.id)).toEqual(['hoy-pronto', 'hoy-tarde', 'lejos'])
  })

  it('manda lo que no ocurrió con lo pasado, no con lo próximo', () => {
    const { upcoming, months } = groupSessions([session('no-ocurrio', 'pending', '2026-09-10')], today)

    expect(upcoming).toHaveLength(0)
    expect(months[0].sessions.map((entry) => entry.id)).toEqual(['no-ocurrio'])
  })

  it('parte lo pasado por meses, del más reciente al más antiguo, y cuenta lo hecho', () => {
    const { months } = groupSessions(
      [
        session('agosto', 'completed', '2026-08-30'),
        session('septiembre-cancelada', 'cancelled', '2026-09-02'),
        session('septiembre-hecha', 'completed', '2026-09-15'),
        session('julio', 'completed', '2025-07-01'),
      ],
      today
    )

    expect(months.map((month) => month.monthKey)).toEqual(['2026-09', '2026-08', '2025-07'])
    expect(months[0].sessions.map((entry) => entry.id)).toEqual([
      'septiembre-hecha',
      'septiembre-cancelada',
    ])
    expect(months.map((month) => month.completedCount)).toEqual([1, 1, 1])
  })

  it('sin sesiones no inventa grupos', () => {
    expect(groupSessions([], today)).toEqual({ upcoming: [], months: [] })
  })
})
