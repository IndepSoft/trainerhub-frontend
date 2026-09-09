import { afterAll, describe, expect, it } from 'vitest'
import { adminClient, deleteAccounts, signedInAs, type TestAccount } from './supabase'

/**
 * Entrenamiento: el catalogo de sistema, lo que cada equipo anade, y los
 * documentos JSONB validados en la base.
 */

interface CrewRow {
  id: string
}

async function createCrewAs(account: TestAccount, name: string): Promise<CrewRow> {
  const { data, error } = await account.client.rpc('create_crew', {
    crew_name: name,
    crew_denomination: 'Crew',
  })
  if (error !== null) throw new Error(`create_crew: ${error.message}`)
  return data as CrewRow
}

const VALID_BLOCK = {
  id: 'block-1',
  method: 'simple',
  restAfterSeconds: 90,
  exercises: [
    { id: 'prescribed-1', exerciseId: 'sentadilla-barra', sets: 3, reps: '8-10', rir: 2, restSeconds: 90 },
  ],
}

describe('catalogo: de sistema y del equipo', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('el catalogo de sistema se lee y no se escribe', async () => {
    const trainer = await signedInAs('catalogo', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    created.push(trainer)

    const groups = await trainer.client.from('muscle_groups').select('id')
    expect(groups.data?.length).toBeGreaterThan(0)

    const tampering = await trainer.client.from('muscle_groups').insert({ id: 'x', name: 'X', region: 'core' })
    expect(tampering.error?.code).toBe('42501')

    // El material de sistema tampoco: la politica de escritura exige `crew_id`.
    const system = await trainer.client.from('equipment').update({ name: 'Barra rota' }).eq('id', 'barra')
    await system
    const { data } = await adminClient().from('equipment').select('name').eq('id', 'barra').single()
    expect(data?.name).toBe('Barra')
  })

  it('el material del equipo lo ve el equipo y no los demas', async () => {
    const trainer = await signedInAs('material', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const stranger = await signedInAs('otro', { intent: 'trainer', first_name: 'O', last_name: 'T' })
    created.push(trainer, stranger)
    const crew = await createCrewAs(trainer, 'Material propio')

    const { data: prensa, error } = await trainer.client
      .from('equipment')
      .insert({ crew_id: crew.id, name: 'Prensa de piernas', kind: 'máquina' })
      .select('id')
      .single()
    expect(error).toBeNull()

    const mine = await trainer.client.from('equipment').select('name').eq('id', prensa?.id)
    expect(mine.data).toHaveLength(1)
    const theirs = await stranger.client.from('equipment').select('name').eq('id', prensa?.id)
    expect(theirs.data).toEqual([])
  })
})

describe('rutinas: el documento se valida en la base', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('una rutina bien formada entra; una con series a cero, no', async () => {
    const trainer = await signedInAs('rutina', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    created.push(trainer)
    const crew = await createCrewAs(trainer, 'Rutinas')

    const good = await trainer.client
      .from('routines')
      .insert({ crew_id: crew.id, title: 'Full body', level: 'Principiante', blocks: [VALID_BLOCK] })
      .select('id, blocks')
      .single()
    expect(good.error).toBeNull()
    expect(good.data?.blocks).toEqual([VALID_BLOCK])

    const broken = {
      ...VALID_BLOCK,
      exercises: [{ ...VALID_BLOCK.exercises[0], sets: 0 }],
    }
    const bad = await trainer.client
      .from('routines')
      .insert({ crew_id: crew.id, title: 'Rota', level: 'Principiante', blocks: [broken] })
    // 23514: check_violation. Es `is_valid_blocks` diciendo que no.
    expect(bad.error?.code).toBe('23514')

    const unknownMethod = await trainer.client
      .from('routines')
      .insert({ crew_id: crew.id, title: 'Rota', level: 'Principiante', blocks: [{ ...VALID_BLOCK, method: 'pirámide' }] })
    expect(unknownMethod.error?.code).toBe('23514')
  })

  it('una rutina asignada no se borra: primero se retira la asignacion', async () => {
    const trainer = await signedInAs('asigna', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    created.push(trainer)
    const crew = await createCrewAs(trainer, 'Asignaciones')
    await adminClient().from('crews').update({ subscription_status: 'active' }).eq('id', crew.id)

    const { data: routine } = await trainer.client
      .from('routines')
      .insert({ crew_id: crew.id, title: 'Asignada', level: 'Principiante', blocks: [VALID_BLOCK] })
      .select('id')
      .single()
    const { data: student } = await trainer.client
      .from('students')
      .insert({ crew_id: crew.id, email: `alumno-${Date.now()}@contrato.local`, membership_status: 'active' })
      .select('id')
      .single()
    const { data: assignment } = await trainer.client
      .from('assignments')
      .insert({ crew_id: crew.id, student_id: student?.id, kind: 'routine', routine_id: routine?.id })
      .select('id')
      .single()

    const blocked = await trainer.client.from('routines').delete().eq('id', routine?.id)
    // 23503: foreign_key_violation. Es `deletion.ts`, en la base.
    expect(blocked.error?.code).toBe('23503')

    await trainer.client.from('assignments').delete().eq('id', assignment?.id)
    const freed = await trainer.client.from('routines').delete().eq('id', routine?.id)
    expect(freed.error).toBeNull()
  })
})
