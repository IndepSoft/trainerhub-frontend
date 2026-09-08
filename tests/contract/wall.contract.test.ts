import { afterAll, describe, expect, it } from 'vitest'
import { adminClient, deleteAccounts, signedInAs, type TestAccount } from './supabase'

/**
 * Muro y ranking: lo que ve un miembro y no ve un extraño, el «me gusta» como
 * un contador y una bandera calculados, y la formula de experiencia en SQL
 * dando lo mismo que `experience.ts`.
 */

interface CrewRow {
  id: string
}

interface PostView {
  id: string
  like_count: number
  liked_by_me: boolean
}

interface RankingRow {
  student_id: string
  experience: number
  completed_sessions: number
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

async function enrollAs(trainer: TestAccount, crewId: string, person: TestAccount): Promise<string> {
  const { data, error } = await trainer.client
    .from('students')
    .insert({ crew_id: crewId, profile_id: person.id, email: person.email, membership_status: 'active' })
    .select('id')
    .single()
  if (error !== null) throw new Error(`students.insert: ${error.message}`)
  return data.id as string
}

describe('muro: anuncios y me gusta', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('publica el equipo tecnico, lee el miembro, y el extraño no ve nada', async () => {
    const trainer = await signedInAs('muro', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Muro')
    const member = await signedInAs('miembro', { intent: 'student', first_name: 'M', last_name: 'I' })
    const stranger = await signedInAs('extranyo', { intent: 'student', first_name: 'E', last_name: 'X' })
    created.push(trainer, member, stranger)
    await enrollAs(trainer, crew.id, member)

    const { data: post, error } = await trainer.client
      .from('crew_posts')
      .insert({ crew_id: crew.id, author_profile_id: trainer.id, body: 'Sabado hay quedada' })
      .select('id')
      .single()
    expect(error).toBeNull()

    // Un alumno no publica: `crew.wall` es del equipo tecnico.
    const fromMember = await member.client
      .from('crew_posts')
      .insert({ crew_id: crew.id, author_profile_id: member.id, body: 'Yo tambien' })
    expect(fromMember.error?.code).toBe('42501')

    const seenByMember = await member.client.from('crew_posts_view').select('id').eq('crew_id', crew.id)
    expect(seenByMember.data?.map((row) => row.id)).toEqual([post?.id])

    const seenByStranger = await stranger.client.from('crew_posts_view').select('id').eq('crew_id', crew.id)
    expect(seenByStranger.data).toEqual([])
  })

  it('el me gusta se cuenta y se marca para quien pregunta; dos toques lo quitan', async () => {
    const trainer = await signedInAs('gusta', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Me gusta')
    const member = await signedInAs('le-gusta', { intent: 'student', first_name: 'L', last_name: 'G' })
    created.push(trainer, member)
    await enrollAs(trainer, crew.id, member)

    const { data: post } = await trainer.client
      .from('crew_posts')
      .insert({ crew_id: crew.id, author_profile_id: trainer.id, body: 'Nuevo horario' })
      .select('id')
      .single()

    const first = await member.client.rpc('toggle_post_like', { post: post?.id })
    expect(first.data).toBe(true)

    const viewForMember = await member.client.from('crew_posts_view').select('*').eq('id', post?.id).single()
    const asMember = viewForMember.data as PostView
    expect(asMember.like_count).toBe(1)
    expect(asMember.liked_by_me).toBe(true)

    const viewForTrainer = await trainer.client.from('crew_posts_view').select('*').eq('id', post?.id).single()
    const asTrainer = viewForTrainer.data as PostView
    expect(asTrainer.like_count).toBe(1)
    expect(asTrainer.liked_by_me).toBe(false)

    const second = await member.client.rpc('toggle_post_like', { post: post?.id })
    expect(second.data).toBe(false)
    const afterRemoval = await member.client.from('crew_posts_view').select('like_count').eq('id', post?.id).single()
    expect(afterRemoval.data?.like_count).toBe(0)
  })
})

describe('ranking: agregados para quien pertenece', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('veinte por sesion y una por serie, y el extraño no lo pide', async () => {
    const trainer = await signedInAs('ranking', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Ranking')
    const one = await signedInAs('primero', { intent: 'student', first_name: 'P', last_name: 'R' })
    const two = await signedInAs('segundo', { intent: 'student', first_name: 'S', last_name: 'E' })
    const stranger = await signedInAs('fuera', { intent: 'student', first_name: 'F', last_name: 'U' })
    created.push(trainer, one, two, stranger)
    const oneId = await enrollAs(trainer, crew.id, one)
    const twoId = await enrollAs(trainer, crew.id, two)

    const today = new Date().toISOString().slice(0, 10)
    const completed = (studentId: string, completedSets: number): Record<string, unknown> => ({
      crew_id: crew.id,
      student_id: studentId,
      title: 'Hecha',
      kind: 'individual',
      modality: 'strength',
      date: today,
      time: '09:00',
      duration_minutes: 60,
      status: 'completed',
      result: { completedSets, totalSets: completedSets, elapsedSeconds: 600, completedAt: today },
    })
    // `one`: dos sesiones de diez y cinco series -> 20+10 + 20+5 = 55.
    // `two`: una sesion de tres series -> 23. La pendiente no cuenta.
    const inserted = await trainer.client.from('sessions').insert([
      completed(oneId, 10),
      completed(oneId, 5),
      completed(twoId, 3),
      { ...completed(twoId, 99), status: 'pending', result: null },
    ])
    expect(inserted.error).toBeNull()

    const { data, error } = await one.client.rpc('crew_ranking', { crew: crew.id, period: 'all' })
    expect(error).toBeNull()
    const rows = data as RankingRow[]
    expect(rows.map((row) => [row.student_id, row.experience, row.completed_sessions])).toEqual([
      [oneId, 55, 2],
      [twoId, 23, 1],
    ])

    const denied = await stranger.client.rpc('crew_ranking', { crew: crew.id, period: 'all' })
    expect(denied.error?.message).toBe('forbidden')

    // Con el ranking apagado, nadie ve filas: ni el equipo tecnico.
    await trainer.client.from('crews').update({ ranking_enabled: false }).eq('id', crew.id)
    const disabled = await trainer.client.rpc('crew_ranking', { crew: crew.id, period: 'all' })
    expect(disabled.data).toEqual([])
  })
})
