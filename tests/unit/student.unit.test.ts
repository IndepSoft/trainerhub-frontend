import { describe, expect, it } from 'vitest'
import { ageOf } from '@/shared/domain/entities/student'

describe('ageOf: la edad sale de la fecha, y cambia el dia del cumpleaños', () => {
  const today = new Date(2026, 8, 9) // 9 de septiembre de 2026

  it('cuenta años cumplidos', () => {
    expect(ageOf('1998-03-14', today)).toBe(28)
    expect(ageOf('2001-05-09', today)).toBe(25)
  })

  it('el dia antes del cumpleaños todavia no se cumple; el mismo dia, si', () => {
    expect(ageOf('1990-09-10', today)).toBe(35)
    expect(ageOf('1990-09-09', today)).toBe(36)
  })

  it('sin fecha, o con una fecha rota, no hay edad', () => {
    expect(ageOf(null, today)).toBeNull()
    expect(ageOf('ayer', today)).toBeNull()
    expect(ageOf('2030-01-01', today)).toBeNull()
  })
})
