import { afterAll, describe, expect, it } from 'vitest'
import { adminClient, deleteAccounts, signedInAs, type TestAccount } from './supabase'

/**
 * La cuenta: darse de baja y lo que queda escrito en la auditoria.
 */

interface CrewRow {
  id: string
}

async function createActiveCrewAs(account: TestAccount, name: string): Promise<CrewRow> {
  const { data, error } = await account.client.rpc('create_crew', {
    crew_name: name,
    crew_denomination: 'Crew',
  })
  if (error !== null) throw new Error(`create_crew: ${error.message}`)
  const crew = data as CrewRow
  await adminClient().from('crews').update({ subscription_status: 'active' }).eq('id', crew.id)
  return crew
}

describe('auditoria: quien cambio que', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('cada escritura en fichas y puestos deja su fila, y solo la lee quien gobierna', async () => {
    const trainer = await signedInAs('auditoria', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Auditada')
    const member = await signedInAs('auditado', { intent: 'student', first_name: 'A', last_name: 'U' })
    created.push(trainer, member)

    const { data: ficha } = await trainer.client
      .from('students')
      .insert({ crew_id: crew.id, profile_id: member.id, email: member.email, membership_status: 'active' })
      .select('id')
      .single()
    await trainer.client.from('students').update({ level: 'Avanzado' }).eq('id', ficha?.id)

    const { data: trail } = await trainer.client
      .from('audit_log')
      .select('table_name, operation, actor_profile_id, before, after')
      .eq('crew_id', crew.id)
      .eq('table_name', 'students')
      .order('at')
    expect(trail?.map((row) => row.operation)).toEqual(['INSERT', 'UPDATE'])
    expect(trail?.[1].actor_profile_id).toBe(trainer.id)
    expect(trail?.[1].before?.level).not.toBe('Avanzado')
    expect(trail?.[1].after?.level).toBe('Avanzado')

    // El alumno no gobierna: no lee la auditoria de su equipo.
    const hidden = await member.client.from('audit_log').select('id').eq('crew_id', crew.id)
    expect(hidden.data).toEqual([])

    // Y nadie la escribe desde fuera.
    const forged = await trainer.client
      .from('audit_log')
      .insert({ crew_id: crew.id, table_name: 'crews', row_id: crew.id, operation: 'DELETE' })
    expect(forged.error?.code).toBe('42501')
  })
})

describe('baja: la cuenta se va, y lo que deja detras', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('quien esta solo en su equipo se lo lleva; quien gobierna a otros, no puede', async () => {
    const lonely = await signedInAs('solo', { intent: 'trainer', first_name: 'S', last_name: 'O' })
    const lonelyCrew = await createActiveCrewAs(lonely, 'Solitario')

    const leader = await signedInAs('lider', { intent: 'trainer', first_name: 'L', last_name: 'I' })
    const crowdedCrew = await createActiveCrewAs(leader, 'Con gente')
    const follower = await signedInAs('seguidor', { intent: 'student', first_name: 'S', last_name: 'E' })
    created.push(leader, follower)
    await leader.client
      .from('students')
      .insert({ crew_id: crowdedCrew.id, profile_id: follower.id, email: follower.email, membership_status: 'active' })

    // El lider no puede irse dejando el equipo sin gobierno.
    const refused = await leader.client.rpc('delete_account')
    expect(refused.error?.message).toBe('lastAdmin')

    // El solitario si, y su equipo se va con el.
    const gone = await lonely.client.rpc('delete_account')
    expect(gone.error).toBeNull()

    const admin = adminClient()
    const { data: crews } = await admin.from('crews').select('id').eq('id', lonelyCrew.id)
    expect(crews).toEqual([])
    const { data: profiles } = await admin.from('profiles').select('id').eq('id', lonely.id)
    expect(profiles).toEqual([])
    const user = await admin.auth.admin.getUserById(lonely.id)
    expect(user.data.user).toBeNull()
  })

  it('un alumno se va y su ficha con el; el equipo sigue', async () => {
    const trainer = await signedInAs('sigue', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Sigue')
    const leaver = await signedInAs('se-va', { intent: 'student', first_name: 'V', last_name: 'A' })
    created.push(trainer)
    await trainer.client
      .from('students')
      .insert({ crew_id: crew.id, profile_id: leaver.id, email: leaver.email, membership_status: 'active' })

    const gone = await leaver.client.rpc('delete_account')
    expect(gone.error).toBeNull()

    const admin = adminClient()
    const { data: students } = await admin.from('students').select('id').eq('profile_id', leaver.id)
    expect(students).toEqual([])
    const { data: crews } = await admin.from('crews').select('id').eq('id', crew.id)
    expect(crews).toHaveLength(1)
  })
})
