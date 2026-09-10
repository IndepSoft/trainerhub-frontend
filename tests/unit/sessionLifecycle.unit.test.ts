import { describe, expect, it } from 'vitest'
import { isMissedSession, isOpenSession, isUpcomingSession } from '@/shared/domain/sessionLifecycle'
import { nextNodeReady } from '@/shared/infrastructure/fake/routeRules'
import type { Session } from '@/shared/domain/entities/session'

/**
 * «No ocurrio» se deriva del dia, no se guarda; y el siguiente nodo de una
 * ruta esta listo cuando cumple puntos y semanas y solo le falta la
 * validacion. Las dos reglas alimentan la bandeja del entrenador.
 */

function session(status: Session['status'], date: string): Session {
  return {
    id: `${status}-${date}`,
    crewId: 'crew-1',
    title: 'Sesion',
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
    result: null,
  }
}

describe('el ciclo de vida derivado de una sesion', () => {
  const today = '2026-09-11'

  it('abierta es pendiente o confirmada; completada y cancelada no', () => {
    expect(isOpenSession(session('pending', today))).toBe(true)
    expect(isOpenSession(session('confirmed', today))).toBe(true)
    expect(isOpenSession(session('completed', today))).toBe(false)
    expect(isOpenSession(session('cancelled', today))).toBe(false)
  })

  it('no ocurrio: abierta y con el dia pasado; hoy todavia puede ocurrir', () => {
    expect(isMissedSession(session('pending', '2026-09-10'), today)).toBe(true)
    expect(isMissedSession(session('confirmed', '2026-09-01'), today)).toBe(true)
    expect(isMissedSession(session('pending', today), today)).toBe(false)
    expect(isMissedSession(session('pending', '2026-09-12'), today)).toBe(false)
    // Lo cerrado no «no ocurrio»: ocurrio, o se decidio que no.
    expect(isMissedSession(session('completed', '2026-09-01'), today)).toBe(false)
    expect(isMissedSession(session('cancelled', '2026-09-01'), today)).toBe(false)
  })

  it('por venir: abierta y de hoy en adelante, que es lo que se mueve o cancela en bloque', () => {
    expect(isUpcomingSession(session('pending', today), today)).toBe(true)
    expect(isUpcomingSession(session('pending', '2026-09-20'), today)).toBe(true)
    expect(isUpcomingSession(session('pending', '2026-09-10'), today)).toBe(false)
    expect(isUpcomingSession(session('completed', '2026-09-20'), today)).toBe(false)
  })
})

describe('nextNodeReady: el hito que solo espera al entrenador', () => {
  it('con puntos y semanas y sin validar, el siguiente nodo; si ya esta validado o faltan numeros, nada', () => {
    // Nodo 2: 300 puntos y 4 semanas.
    expect(nextNodeReady({ position: 1, points: 300, adherentWeeks: 4, validatedPositions: [] })).toBe(2)
    expect(nextNodeReady({ position: 1, points: 299, adherentWeeks: 4, validatedPositions: [] })).toBeNull()
    expect(nextNodeReady({ position: 1, points: 300, adherentWeeks: 3, validatedPositions: [] })).toBeNull()
    expect(nextNodeReady({ position: 1, points: 300, adherentWeeks: 4, validatedPositions: [2] })).toBeNull()
    // Desde el nodo 4 no hay siguiente.
    expect(nextNodeReady({ position: 4, points: 9999, adherentWeeks: 99, validatedPositions: [2, 3, 4] })).toBeNull()
  })
})
