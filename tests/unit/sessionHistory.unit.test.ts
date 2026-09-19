import { describe, expect, it } from 'vitest'
import { historyFrom, historyMonths } from '@/domains/progress/libs/sessionHistory'
import type { Session } from '@/shared/domain/entities/session'
import type { SessionScore } from '@/shared/domain/entities/progress'

/**
 * El historial del alumno: qué sesiones entran, en qué orden y con qué puntos.
 *
 * Lo que se fija aquí es lo que se puede romper sin que se vea: que ordene por
 * el día en que se CERRÓ y no por el que estaba agendada, que una sesión sin
 * puntuar no valga cero, y que los meses se corten donde cambia el mes.
 */

interface SessionOptions {
  status?: Session['status']
  /** El día en que se cerró, si es distinto del agendado. */
  completedAt?: string
  completedSets?: number
  totalSets?: number
  elapsedSeconds?: number
}

function session(id: string, date: string, options: SessionOptions = {}): Session {
  const {
    status = 'completed',
    completedAt = date,
    completedSets = 12,
    totalSets = 12,
    elapsedSeconds = 3120,
  } = options

  return {
    id,
    crewId: 'crew-1',
    title: 'Entrenamiento personal',
    studentId: 'student-1',
    kind: 'individual',
    modality: 'strength',
    category: '',
    date,
    time: '09:00',
    durationMinutes: 60,
    location: '',
    status,
    notes: '',
    routineId: null,
    result:
      status === 'completed' ? { completedSets, totalSets, elapsedSeconds, completedAt } : null,
  }
}

function score(sessionId: string, points: number, completedOn: string): SessionScore {
  return {
    sessionId,
    studentId: 'student-1',
    crewId: 'crew-1',
    completedOn,
    base: points,
    adherence: 1,
    progress: 1,
    cohort: 1,
    points,
    ruleVersion: 1,
    flaggedReason: null,
    reviewedAt: null,
  }
}

describe('historyFrom: qué entra en el historial', () => {
  it('sólo lo cerrado, del día más reciente al más antiguo', () => {
    const sessions = [
      session('a', '2026-09-11'),
      session('b', '2026-09-15'),
      session('c', '2026-09-16', { status: 'pending' }),
      session('d', '2026-09-14', { status: 'cancelled' }),
    ]

    expect(historyFrom(sessions, []).map((entry) => entry.sessionId)).toEqual(['b', 'a'])
  })

  it('ordena por el día en que se cerró, no por el agendado', () => {
    /*
     * Una sesión del martes cerrada el jueves es esfuerzo del jueves: es el
     * mismo criterio de la racha y del ranking. Ordenar por `date` la pondría
     * antes que la del miércoles, que se cerró primero.
     */
    const sessions = [
      session('martes', '2026-09-15', { completedAt: '2026-09-17' }),
      session('miercoles', '2026-09-16'),
    ]

    expect(historyFrom(sessions, []).map((entry) => entry.sessionId)).toEqual([
      'martes',
      'miercoles',
    ])
  })

  it('pega a cada sesión sus puntos, y deja en null la que no tiene', () => {
    const sessions = [session('a', '2026-09-15'), session('vieja', '2026-09-14')]
    const entries = historyFrom(sessions, [score('a', 34, '2026-09-15')])

    expect(entries[0].points).toBe(34)
    // Cerrada antes de que el servidor puntuara: un cero diría que no sumó.
    expect(entries[1].points).toBeNull()
  })

  it('redondea los minutos y conserva las series medidas', () => {
    const entries = historyFrom(
      [session('a', '2026-09-15', { completedSets: 10, totalSets: 12, elapsedSeconds: 3150 })],
      []
    )

    expect(entries[0]).toMatchObject({ completedSets: 10, totalSets: 12, minutes: 53 })
  })
})

describe('historyMonths: dónde se corta cada mes', () => {
  it('agrupa por mes y suma sus puntos', () => {
    const sessions = [
      session('a', '2026-09-15'),
      session('b', '2026-09-01'),
      session('c', '2026-08-28'),
    ]
    const scores = [
      score('a', 34, '2026-09-15'),
      score('b', 29, '2026-09-01'),
      score('c', 30, '2026-08-28'),
    ]

    const months = historyMonths(historyFrom(sessions, scores))

    expect(months.map((month) => month.month)).toEqual(['2026-09', '2026-08'])
    expect(months[0].points).toBe(63)
    expect(months[1].entries.map((entry) => entry.sessionId)).toEqual(['c'])
  })

  it('una sesión sin puntuar no resta del mes', () => {
    const sessions = [session('a', '2026-09-15'), session('sinPuntos', '2026-09-10')]
    const months = historyMonths(historyFrom(sessions, [score('a', 34, '2026-09-15')]))

    expect(months).toHaveLength(1)
    expect(months[0].points).toBe(34)
  })

  it('sin sesiones no hay meses', () => {
    expect(historyMonths(historyFrom([], []))).toEqual([])
  })
})
