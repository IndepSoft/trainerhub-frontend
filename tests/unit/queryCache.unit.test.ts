import { beforeEach, describe, expect, it } from 'vitest'
import {
  cacheKey,
  clearQueryCache,
  readCachedValue,
  writeCachedValue,
} from '@/shared/lib/queryCache'

/**
 * La caché de lecturas: lo que permite volver a un módulo sin empezar de cero.
 *
 * Se prueba AQUÍ y no en el navegador porque lo que puede salir mal es de
 * datos, no de pintado: que la clave de un equipo responda por otro, o que lo
 * de una sesión sobreviva a la siguiente. Las dos cosas serían fugas, y las dos
 * se ven con un mapa y tres asertos.
 */
describe('caché de lecturas', () => {
  beforeEach(() => {
    clearQueryCache()
  })

  it('devuelve lo guardado, y undefined para lo que nunca se leyó', () => {
    expect(readCachedValue('students|crew-1')).toBeUndefined()

    writeCachedValue('students|crew-1', ['ana'])

    expect(readCachedValue('students|crew-1')).toEqual(['ana'])
  })

  it('no mezcla equipos: la misma lectura en otro equipo es otra entrada', () => {
    writeCachedValue(cacheKey(['students', 'crew-1']), ['ana'])

    // El equipo nuevo todavía no ha leído nada, y eso es lo que tiene que
    // decir: sin esto se pintaría un instante el padrón del equipo anterior.
    expect(readCachedValue(cacheKey(['students', 'crew-2']))).toBeUndefined()
    expect(readCachedValue(cacheKey(['students', 'crew-1']))).toEqual(['ana'])
  })

  it('distingue «sin ámbito» de un ámbito cualquiera', () => {
    writeCachedValue(cacheKey(['sessions', null]), ['ninguna'])
    writeCachedValue(cacheKey(['sessions', 'crew-1']), ['una'])

    expect(readCachedValue(cacheKey(['sessions', null]))).toEqual(['ninguna'])
    expect(readCachedValue(cacheKey(['sessions', undefined]))).toBeUndefined()
  })

  it('cerrar sesión se lo lleva todo', () => {
    writeCachedValue(cacheKey(['students', 'crew-1']), ['ana'])
    writeCachedValue(cacheKey(['sessions', 'crew-1']), ['lunes'])

    clearQueryCache()

    // Lo de quien acaba de salir no puede parpadear en la pantalla de quien
    // entre después en este mismo teléfono.
    expect(readCachedValue(cacheKey(['students', 'crew-1']))).toBeUndefined()
    expect(readCachedValue(cacheKey(['sessions', 'crew-1']))).toBeUndefined()
  })

  it('una clave se escribe entera: ninguna parte se omite por estar vacía', () => {
    // «Las sesiones de nadie» y «las sesiones del alumno 7» no pueden colisionar.
    expect(cacheKey(['sessions', null])).not.toEqual(cacheKey(['sessions']))
    expect(cacheKey(['loads', 'crew-1', 'student-7'])).toBe('loads|crew-1|student-7')
  })
})
