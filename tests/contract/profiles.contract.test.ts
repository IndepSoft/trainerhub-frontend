import { afterAll, describe, expect, it } from 'vitest'
import { adminClient, anonClient, deleteAccounts, signedInAs, type TestAccount } from './supabase'

/**
 * Perfiles y roles: lo que ya estaba en la nube, ahora con su especificacion.
 *
 * Es el primer contrato y fija la forma de todos los que vienen: lo que el
 * puerto promete, y lo que RLS PROHIBE. Las pruebas negativas no son
 * paranoia: son la unica evidencia de que una politica hace lo que dice.
 */
describe('profiles: la fila nace con la cuenta', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('un alta con intencion de alumno nace como alumno, con su nombre', async () => {
    const account = await signedInAs('alumno', {
      intent: 'student',
      first_name: 'Ana',
      last_name: 'Contrato',
    })
    created.push(account)

    const { data } = await account.client.from('profiles').select('*').eq('id', account.id).single()

    expect(data).toMatchObject({ role: 'student', first_name: 'Ana', last_name: 'Contrato' })
  })

  it('un alta con intencion de entrenador nace como entrenador, con su especialidad', async () => {
    const account = await signedInAs('entrenador', {
      intent: 'trainer',
      first_name: 'Vera',
      last_name: 'Contrato',
      specialty: 'Fuerza',
    })
    created.push(account)

    const { data } = await account.client.from('profiles').select('*').eq('id', account.id).single()

    expect(data).toMatchObject({ role: 'trainer', specialty: 'Fuerza' })
  })

  it('declarar intencion de administrador NO da administrador', async () => {
    const account = await signedInAs('mentiroso', { intent: 'admin', first_name: 'X', last_name: 'Y' })
    created.push(account)

    const { data } = await account.client.from('profiles').select('role').eq('id', account.id).single()

    expect(data?.role).toBe('student')
  })
})

describe('profiles: lo que RLS prohibe', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('nadie se asciende a administrador desde su propia fila', async () => {
    const account = await signedInAs('ascenso', { intent: 'trainer', first_name: 'A', last_name: 'B' })
    created.push(account)

    const { error } = await account.client.from('profiles').update({ role: 'admin' }).eq('id', account.id)

    // 42501: el permiso de UPDATE de `authenticated` va por columna y `role` no
    // esta en la lista. No es la politica RLS la que corta: es el permiso.
    expect(error?.code).toBe('42501')

    const admin = adminClient()
    const { data } = await admin.from('profiles').select('role').eq('id', account.id).single()
    expect(data?.role).toBe('trainer')
  })

  it('cada uno edita su nombre y su biografia, y solo los suyos', async () => {
    const own = await signedInAs('propio', { intent: 'trainer', first_name: 'A', last_name: 'B' })
    const other = await signedInAs('ajeno', { intent: 'trainer', first_name: 'C', last_name: 'D' })
    created.push(own, other)

    const mine = await own.client
      .from('profiles')
      .update({ first_name: 'Cambiado', bio: 'Una linea' })
      .eq('id', own.id)
      .select('first_name, bio')
      .single()
    expect(mine.data).toEqual({ first_name: 'Cambiado', bio: 'Una linea' })

    // Sobre la fila de otro, RLS no encuentra nada que actualizar: cero filas,
    // sin error. Es la semantica de una politica de fila, y por eso se
    // comprueba leyendo por debajo que no cambio.
    await own.client.from('profiles').update({ first_name: 'Intruso' }).eq('id', other.id)
    const { data } = await adminClient().from('profiles').select('first_name').eq('id', other.id).single()
    expect(data?.first_name).toBe('C')
  })

  it('un perfil ajeno no se lee, y sin sesion no se lee ninguno', async () => {
    const own = await signedInAs('lector', { intent: 'student', first_name: 'A', last_name: 'B' })
    const other = await signedInAs('leido', { intent: 'student', first_name: 'C', last_name: 'D' })
    created.push(own, other)

    const foreign = await own.client.from('profiles').select('id').eq('id', other.id)
    expect(foreign.data).toEqual([])

    const anonymous = await anonClient().from('profiles').select('id')
    expect(anonymous.data ?? []).toEqual([])
  })
})
