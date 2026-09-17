import { describe, expect, it } from 'vitest'
import { dayAgenda } from '@/domains/calendar/libs/dayAgenda'
import type { Session } from '@/shared/domain/entities/session'

/**
 * El día como lista: qué orden llevan las filas y cuándo se dice que hay hueco.
 *
 * Lo que se fija aquí es que el hueco se mide desde que TERMINA la anterior y no
 * desde que empieza —una sesión de dos horas no deja libre el rato que dura— y
 * que por debajo del umbral no se dice nada, que es lo que evita llenar el día
 * de líneas entre sesión y sesión.
 */

function session(id: string, time: string, durationMinutes = 60): Session {
  return {
    id,
    crewId: 'crew-1',
    title: 'Entrenamiento personal',
    studentId: 'student-1',
    kind: 'individual',
    modality: 'strength',
    category: '',
    date: '2026-09-17',
    time,
    durationMinutes,
    location: 'Gimnasio Principal',
    status: 'confirmed',
    notes: '',
    routineId: null,
    result: null,
  }
}

function describeEntries(sessions: Session[]): string[] {
  return dayAgenda(sessions).map((entry) =>
    entry.kind === 'gap' ? `libre hasta ${entry.until}` : entry.session.time
  )
}

describe('dayAgenda: el día en filas', () => {
  it('ordena por hora, aunque lleguen desordenadas', () => {
    const entries = describeEntries([
      session('tarde', '18:00'),
      session('manana', '09:00'),
      session('mediodia', '10:30'),
    ])

    expect(entries).toEqual(['09:00', '10:30', 'libre hasta 18:00', '18:00'])
    // La línea va ANTES de la sesión con la que vuelve a haber algo.
    expect(dayAgenda([session('tarde', '18:00'), session('manana', '09:00')])[1].kind).toBe('gap')
  })

  it('el hueco se cuenta desde que termina la anterior', () => {
    // De 09:00 a 11:00 entrenando; de 11:00 a 12:30 hay hora y media, que no
    // llega al umbral. Midiendo desde el comienzo habrían sido tres horas y
    // media y la línea habría salido con la sala ocupada.
    expect(describeEntries([session('larga', '09:00', 120), session('siguiente', '12:30')])).toEqual([
      '09:00',
      '12:30',
    ])
  })

  it('a partir de dos horas sí se dice', () => {
    // Termina a las 10:00; a las 12:00 son dos horas justas, que ya cuentan.
    expect(describeEntries([session('a', '09:00', 60), session('b', '12:00')])).toEqual([
      '09:00',
      'libre hasta 12:00',
      '12:00',
    ])
  })

  it('el umbral se puede afinar sin tocar la regla', () => {
    const sessions = [session('a', '09:00', 60), session('b', '10:30')]
    expect(dayAgenda(sessions).some((entry) => entry.kind === 'gap')).toBe(false)
    expect(dayAgenda(sessions, 30).some((entry) => entry.kind === 'gap')).toBe(true)
  })

  it('un día vacío no tiene filas, y una sola sesión no tiene huecos', () => {
    expect(dayAgenda([])).toEqual([])
    expect(describeEntries([session('unica', '09:00')])).toEqual(['09:00'])
  })
})
