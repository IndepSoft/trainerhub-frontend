import { afterAll, describe, expect, it } from 'vitest'
import { adminClient, deleteAccounts, signedInAs, type TestAccount } from './supabase'
import { ALL_CAPABILITIES, CAPABILITIES_BY_ROLE } from '@/shared/domain/permissions'
import type { CrewRole } from '@/shared/domain/entities/crew'

/**
 * Equipos y puestos: la tenencia, y las dos funciones de las que cuelga todo.
 *
 * Aqui se ejercitan las funciones del servidor y las politicas, no los
 * adaptadores de TypeScript: lo que se quiere saber es que Postgres impide lo
 * que el navegador solo desaconseja.
 */

interface CrewRow {
  id: string
  name: string
  join_token: string
  subscription_status: string
}

async function createCrewAs(account: TestAccount, name: string): Promise<CrewRow> {
  const { data, error } = await account.client.rpc('create_crew', {
    crew_name: name,
    crew_denomination: 'Crew',
  })
  if (error !== null) throw new Error(`create_crew: ${error.message}`)
  return data as CrewRow
}

describe('role_capabilities: la tabla dice lo mismo que la constante', () => {
  it('cada rol tiene en la base exactamente las capacidades de CAPABILITIES_BY_ROLE', async () => {
    const { data } = await adminClient().from('role_capabilities').select('role, capability')
    const rows = (data ?? []) as { role: CrewRole; capability: string }[]

    for (const role of ['admin', 'trainer', 'student'] as const) {
      const inDatabase = rows.filter((row) => row.role === role).map((row) => row.capability).sort()
      const inCode = [...CAPABILITIES_BY_ROLE[role]].sort()
      expect(inDatabase, role).toEqual(inCode)
    }

    // Y ninguna capacidad que el codigo no conozca.
    for (const row of rows) expect(ALL_CAPABILITIES).toContain(row.capability)
  })
})

describe('crews: crear, gobernar y buscar', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('crear un equipo nombra a su fundador administrador en el mismo acto', async () => {
    const founder = await signedInAs('fundador', { intent: 'trainer', first_name: 'F', last_name: 'U' })
    created.push(founder)

    const crew = await createCrewAs(founder, 'Hierro de Contrato')
    expect(crew.join_token).toMatch(/^[A-Z2-9]{8}$/)
    expect(crew.subscription_status).toBe('pending')

    const { data: posts } = await founder.client
      .from('crew_staff')
      .select('role, profile_id')
      .eq('crew_id', crew.id)
    expect(posts).toEqual([{ role: 'admin', profile_id: founder.id }])
  })

  it('un equipo no se lee desde fuera, y su token lo encuentra cualquiera identificado', async () => {
    const founder = await signedInAs('dueno', { intent: 'trainer', first_name: 'D', last_name: 'U' })
    const stranger = await signedInAs('ajeno', { intent: 'student', first_name: 'A', last_name: 'J' })
    created.push(founder, stranger)

    const crew = await createCrewAs(founder, 'Cerrado')

    const direct = await stranger.client.from('crews').select('id').eq('id', crew.id)
    expect(direct.data).toEqual([])

    const found = await stranger.client.rpc('find_crew_by_join_token', {
      token: crew.join_token.toLowerCase(),
    })
    expect(found.data).toHaveLength(1)
    // Solo lo que la pantalla de unirse enseña: sin token, sin fundador.
    expect(Object.keys(found.data[0]).sort()).toEqual(
      ['denomination', 'id', 'name', 'photo_url', 'requires_approval', 'subscription_status']
    )
  })

  it('los ajustes los cambia quien tiene crew.settings, y nadie mas', async () => {
    const founder = await signedInAs('ajustes', { intent: 'trainer', first_name: 'A', last_name: 'J' })
    const trainer = await signedInAs('monitor', { intent: 'trainer', first_name: 'M', last_name: 'O' })
    created.push(founder, trainer)

    const crew = await createCrewAs(founder, 'Ajustable')
    await founder.client.from('crew_staff').insert({ crew_id: crew.id, profile_id: trainer.id, role: 'trainer' })

    // El entrenador ve el equipo pero no lo gobierna: el update no encuentra fila.
    await trainer.client.from('crews').update({ name: 'Usurpado' }).eq('id', crew.id)
    const { data: intact } = await adminClient().from('crews').select('name').eq('id', crew.id).single()
    expect(intact?.name).toBe('Ajustable')

    // El administrador si. Y el token no se toca desde la tabla: el permiso por
    // columna lo deja fuera.
    const own = await founder.client.from('crews').update({ name: 'Renombrado' }).eq('id', crew.id)
    expect(own.error).toBeNull()
    const token = await founder.client.from('crews').update({ join_token: 'FALSO123' }).eq('id', crew.id)
    expect(token.error?.code).toBe('42501')
  })

  it('el ultimo administrador no se va: ni se degrada ni se borra', async () => {
    const founder = await signedInAs('ultimo', { intent: 'trainer', first_name: 'U', last_name: 'L' })
    created.push(founder)

    const crew = await createCrewAs(founder, 'Solo')
    const { data: post } = await founder.client
      .from('crew_staff')
      .select('id')
      .eq('crew_id', crew.id)
      .single()

    const demoted = await founder.client.from('crew_staff').update({ role: 'trainer' }).eq('id', post?.id)
    expect(demoted.error?.message).toBe('lastAdmin')

    const removed = await founder.client.from('crew_staff').delete().eq('id', post?.id)
    expect(removed.error?.message).toBe('lastAdmin')

    // Con un segundo administrador, el primero si puede irse.
    const second = await signedInAs('segundo', { intent: 'trainer', first_name: 'S', last_name: 'E' })
    created.push(second)
    await founder.client.from('crew_staff').insert({ crew_id: crew.id, profile_id: second.id, role: 'admin' })
    const leaving = await founder.client.from('crew_staff').delete().eq('id', post?.id)
    expect(leaving.error).toBeNull()
  })

  it('los companeros de equipo se leen el nombre; los de fuera, no', async () => {
    const founder = await signedInAs('nombre', { intent: 'trainer', first_name: 'Nora', last_name: 'Uno' })
    const mate = await signedInAs('companero', { intent: 'trainer', first_name: 'Cato', last_name: 'Dos' })
    const stranger = await signedInAs('extrano', { intent: 'trainer', first_name: 'Eva', last_name: 'Tres' })
    created.push(founder, mate, stranger)

    const crew = await createCrewAs(founder, 'Nombres')
    await founder.client.from('crew_staff').insert({ crew_id: crew.id, profile_id: mate.id, role: 'trainer' })

    const { data: staff } = await mate.client
      .from('crew_staff')
      .select('profiles!crew_staff_profile_id_fkey(first_name)')
      .eq('crew_id', crew.id)
    const names = (staff ?? []).map((row) => (row.profiles as { first_name: string } | null)?.first_name).sort()
    expect(names).toEqual(['Cato', 'Nora'])

    const { data: hidden } = await stranger.client.from('profiles').select('id').eq('id', founder.id)
    expect(hidden).toEqual([])
  })
})
