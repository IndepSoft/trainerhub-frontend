import { afterAll, describe, expect, it } from 'vitest'
import { adminClient, deleteAccounts, signedInAs, type TestAccount } from './supabase'

/**
 * Rachas protegidas y cohortes: quien pausa, quien usa el comodin y con que
 * limite, que la racha de las insignias salte las pausas, y que el ranking
 * compare entre iguales.
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

async function enrollAs(
  trainer: TestAccount,
  crewId: string,
  person: TestAccount,
  extra: Record<string, unknown> = {}
): Promise<string> {
  const { data, error } = await trainer.client
    .from('students')
    .insert({ crew_id: crewId, profile_id: person.id, email: person.email, membership_status: 'active', ...extra })
    .select('id')
    .single()
  if (error !== null) throw new Error(`students.insert: ${error.message}`)
  return data.id as string
}

function completedOn(crewId: string, studentId: string, day: string): Record<string, unknown> {
  return {
    crew_id: crewId, student_id: studentId, title: day, kind: 'individual', modality: 'strength',
    date: day, time: '09:00', duration_minutes: 60, status: 'completed',
    result: { completedSets: 3, totalSets: 3, elapsedSeconds: 1800, completedAt: day },
  }
}

describe('rachas: pausas y comodines', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('pausa quien gestiona; el comodin lo usa el alumno, y la base cuenta cuantos le quedan', async () => {
    const trainer = await signedInAs('pausa', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Con pausas')
    const person = await signedInAs('pausada', { intent: 'student', first_name: 'P', last_name: 'A' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    // El alumno no pausa; quien gestiona, si.
    const denied = await person.client.rpc('pause_streak', {
      student: studentId, pause_from: '2026-08-10', pause_to: '2026-08-14', pause_reason: 'injury',
    })
    expect(denied.error?.message).toBe('forbidden')
    const paused = await trainer.client.rpc('pause_streak', {
      student: studentId, pause_from: '2026-08-10', pause_to: '2026-08-14', pause_reason: 'injury',
    })
    expect(paused.error).toBeNull()

    // Sin ocho semanas seguidas no hay comodin.
    const { data: none } = await person.client.rpc('wildcards_available', { student: studentId })
    expect(none).toBe(0)
    const early = await person.client.rpc('use_streak_wildcard', { student: studentId, day: '2026-09-01' })
    expect(early.error?.message).toBe('noWildcards')

    // Nueve semanas seguidas entrenando: un comodin.
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const rows: Record<string, unknown>[] = []
    for (let week = 0; week < 9; week += 1) {
      const date = new Date(monday)
      date.setDate(monday.getDate() - week * 7)
      rows.push(completedOn(crew.id, studentId, date.toISOString().slice(0, 10)))
    }
    expect((await trainer.client.from('sessions').insert(rows)).error).toBeNull()

    const { data: one } = await person.client.rpc('wildcards_available', { student: studentId })
    expect(one).toBe(1)

    // Ni el futuro ni hoy: cubrir el futuro seria pausar.
    const future = await person.client.rpc('use_streak_wildcard', { student: studentId, day: '2099-01-01' })
    expect(future.error?.message).toBe('invalidReference')

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const used = await person.client.rpc('use_streak_wildcard', { student: studentId, day: yesterday.toISOString().slice(0, 10) })
    expect(used.error).toBeNull()
    const { data: spent } = await person.client.rpc('wildcards_available', { student: studentId })
    expect(spent).toBe(0)

    // Y las pausas se leen: las suyas el alumno, todas el equipo tecnico.
    const { data: own } = await person.client.from('streak_pauses').select('reason').eq('student_id', studentId)
    expect(own?.map((row) => row.reason).sort()).toEqual(['injury', 'wildcard'])
  })

  it('una pausa no rompe la racha que miran las insignias', async () => {
    const trainer = await signedInAs('racha-pausada', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Racha pausada')
    const person = await signedInAs('lesionada', { intent: 'student', first_name: 'L', last_name: 'E' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    // Cinco dias, dos de lesion, dos dias: siete de racha protegida.
    await trainer.client.rpc('pause_streak', {
      student: studentId, pause_from: '2026-08-06', pause_to: '2026-08-07', pause_reason: 'injury',
    })
    for (const day of ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-08']) {
      expect((await trainer.client.from('sessions').insert(completedOn(crew.id, studentId, day))).error).toBeNull()
    }
    const { data: before } = await adminClient().from('student_badges').select('badge_code').eq('student_id', studentId).eq('badge_code', 'perfect-week')
    expect(before).toHaveLength(0)

    expect((await trainer.client.from('sessions').insert(completedOn(crew.id, studentId, '2026-08-09'))).error).toBeNull()
    const { data: streak } = await person.client.rpc('protected_streak', { student: studentId, asof: '2026-08-09' })
    expect(streak).toBe(7)
    const { data: after } = await adminClient().from('student_badges').select('unlocked_on').eq('student_id', studentId).eq('badge_code', 'perfect-week').single()
    expect(after?.unlocked_on).toBe('2026-08-09')
  })
})

describe('cohortes: el ranking compara entre iguales', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('con cohorte solo salen los de esa cohorte; sin ella, todos', async () => {
    const trainer = await signedInAs('cohortes-rank', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Por cohortes')
    const young = await signedInAs('joven-rank', { intent: 'student', first_name: 'J', last_name: 'O' })
    const senior = await signedInAs('senior-rank', { intent: 'student', first_name: 'S', last_name: 'E' })
    created.push(trainer, young, senior)
    const year = new Date().getFullYear()
    const youngId = await enrollAs(trainer, crew.id, young, { birth_date: `${year - 16}-03-03` })
    const seniorId = await enrollAs(trainer, crew.id, senior, { birth_date: `${year - 55}-03-03` })

    const { data: youthCohort } = await young.client.rpc('cohort_of', { student: youngId })
    expect(youthCohort).toBe('youth')

    const { data: onlyYouth } = await young.client.rpc('crew_ranking', { crew: crew.id, period: 'all', cohort_filter: 'youth' })
    expect((onlyYouth as { student_id: string }[]).map((row) => row.student_id)).toEqual([youngId])

    const { data: everyone } = await trainer.client.rpc('crew_ranking', { crew: crew.id, period: 'all' })
    expect((everyone as { student_id: string }[]).map((row) => row.student_id).sort()).toEqual([youngId, seniorId].sort())
  })
})
