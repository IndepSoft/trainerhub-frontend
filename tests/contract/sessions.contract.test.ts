import { afterAll, describe, expect, it } from 'vitest'
import { adminClient, deleteAccounts, signedInAs, type TestAccount } from './supabase'

/**
 * Agenda y sesion: quien ve que sesiones, lo unico que un alumno puede hacer
 * con la suya -cerrarla-, y el documento de resultado validado en la base.
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

async function enrollAs(trainer: TestAccount, crewId: string, person: TestAccount): Promise<string> {
  const { data, error } = await trainer.client
    .from('students')
    .insert({ crew_id: crewId, profile_id: person.id, email: person.email, membership_status: 'active' })
    .select('id')
    .single()
  if (error !== null) throw new Error(`students.insert: ${error.message}`)
  return data.id as string
}

/** La clave `YYYY-MM-DD` de hoy mas `offset` dias, en local. */
function dayKey(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function sessionFor(crewId: string, studentId: string | null, title: string): Record<string, unknown> {
  return {
    crew_id: crewId,
    student_id: studentId,
    title,
    kind: studentId === null ? 'group' : 'individual',
    modality: 'strength',
    date: '2026-09-10',
    time: '09:00',
    duration_minutes: 60,
  }
}

const VALID_RESULT = {
  completedSets: 9,
  totalSets: 9,
  elapsedSeconds: 2700,
  completedAt: '2026-09-10',
  sets: [{ exerciseId: 'sentadilla-barra', repsDone: 8, workSeconds: 40, weightKg: 60 }],
}

describe('sessions: quien ve cuales', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('el alumno ve las suyas y las grupales; no las de otro alumno', async () => {
    const trainer = await signedInAs('agenda', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Agenda')
    const one = await signedInAs('alumno-uno', { intent: 'student', first_name: 'U', last_name: 'N' })
    const two = await signedInAs('alumno-dos', { intent: 'student', first_name: 'D', last_name: 'O' })
    created.push(trainer, one, two)
    const oneId = await enrollAs(trainer, crew.id, one)
    const twoId = await enrollAs(trainer, crew.id, two)

    const inserted = await trainer.client.from('sessions').insert([
      sessionFor(crew.id, oneId, 'De uno'),
      sessionFor(crew.id, twoId, 'De dos'),
      sessionFor(crew.id, null, 'Grupal'),
    ])
    expect(inserted.error).toBeNull()

    const seenByOne = await one.client.from('sessions').select('title').eq('crew_id', crew.id).order('title')
    expect(seenByOne.data?.map((row) => row.title)).toEqual(['De uno', 'Grupal'])

    const seenByTrainer = await trainer.client.from('sessions').select('title').eq('crew_id', crew.id)
    expect(seenByTrainer.data).toHaveLength(3)

    // Un alumno no agenda: `schedule.manage` es del equipo tecnico.
    const scheduling = await one.client.from('sessions').insert(sessionFor(crew.id, oneId, 'Por mi cuenta'))
    expect(scheduling.error?.code).toBe('42501')
  })
})

describe('sessions: cerrar la sesion', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('el alumno cierra la suya en una llamada; mover la fecha no', async () => {
    const trainer = await signedInAs('cierre', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Cierre')
    const person = await signedInAs('cierra', { intent: 'student', first_name: 'C', last_name: 'I' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    const { data: session } = await trainer.client
      .from('sessions')
      .insert(sessionFor(crew.id, studentId, 'Pierna'))
      .select('id')
      .single()

    const moved = await person.client.from('sessions').update({ date: '2026-09-11' }).eq('id', session?.id)
    expect(moved.error?.message).toBe('forbidden')

    const completed = await person.client.rpc('complete_session', {
      session: session?.id,
      session_result: VALID_RESULT,
    })
    expect(completed.error).toBeNull()

    const { data: row } = await adminClient()
      .from('sessions')
      .select('status, result')
      .eq('id', session?.id)
      .single()
    expect(row?.status).toBe('completed')
    expect(row?.result).toEqual(VALID_RESULT)
  })

  it('un resultado sin fecha de cierre no entra', async () => {
    const trainer = await signedInAs('resultado', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Resultados')
    created.push(trainer)

    const { data: session } = await trainer.client
      .from('sessions')
      .insert(sessionFor(crew.id, null, 'Grupal'))
      .select('id')
      .single()

    const { completedAt: _, ...withoutDate } = VALID_RESULT
    const rejected = await trainer.client.rpc('complete_session', {
      session: session?.id,
      session_result: withoutDate,
    })
    // 23514: check_violation. Es `is_valid_session_result` diciendo que no.
    expect(rejected.error?.code).toBe('23514')

    const missing = await trainer.client.rpc('complete_session', {
      session: '00000000-0000-4000-8000-000000000000',
      session_result: VALID_RESULT,
    })
    expect(missing.error?.message).toBe('notFound')
  })
})

describe('sessions: el RPE de cada serie', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('entre 1 y 10 se guarda; fuera de rango la base lo rechaza; ausente vale', async () => {
    const trainer = await signedInAs('rpe', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Con RPE')
    const person = await signedInAs('esfuerzo', { intent: 'student', first_name: 'E', last_name: 'S' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    const { data: session } = await trainer.client
      .from('sessions')
      .insert(sessionFor(crew.id, studentId, 'Con esfuerzo'))
      .select('id')
      .single()

    const withRpe = (rpe: number) => ({
      ...VALID_RESULT,
      sets: [{ ...VALID_RESULT.sets[0], rpe }],
    })

    const tooHigh = await trainer.client.rpc('complete_session', { session: session?.id, session_result: withRpe(11) })
    expect(tooHigh.error?.code).toBe('23514')
    const tooLow = await trainer.client.rpc('complete_session', { session: session?.id, session_result: withRpe(0) })
    expect(tooLow.error?.code).toBe('23514')

    const accepted = await trainer.client.rpc('complete_session', { session: session?.id, session_result: withRpe(8) })
    expect(accepted.error).toBeNull()
    const { data: row } = await adminClient().from('sessions').select('result').eq('id', session?.id).single()
    expect(row?.result).toEqual(withRpe(8))
  })
})

describe('sessions: volcar un plan', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('todas las sesiones salen del mismo volcado, o ninguna', async () => {
    const trainer = await signedInAs('volcado', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Volcados')
    const person = await signedInAs('vuelca', { intent: 'student', first_name: 'V', last_name: 'U' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    const { data: plan, error: planError } = await trainer.client
      .from('plans')
      .insert({
        crew_id: crew.id,
        title: 'Plan',
        level: 'Principiante',
        objective_id: 'hipertrofia',
        split_id: 'full-body',
        weekly_frequency: 3,
        weeks: [{ number: 1, isDeload: false, days: [{ dayOfWeek: 1, routineId: null }] }],
      })
      .select('id')
      .single()
    expect(planError).toBeNull()
    const { data: assignment, error: assignmentError } = await trainer.client
      .from('assignments')
      .insert({ crew_id: crew.id, student_id: studentId, kind: 'plan', plan_id: plan?.id })
      .select('id')
      .single()
    expect(assignmentError).toBeNull()

    const batch = [sessionFor(crew.id, studentId, 'Semana 1'), sessionFor(crew.id, studentId, 'Semana 2')]
    const { data: rows, error } = await trainer.client.rpc('create_sessions', {
      batch,
      source_assignment: assignment?.id,
    })
    expect(error).toBeNull()
    expect(rows).toHaveLength(2)
    expect((rows as { assignment_id: string }[]).every((row) => row.assignment_id === assignment?.id)).toBe(true)

    // Una sesion invalida en el lote tumba el lote entero.
    const broken = [...batch, { ...sessionFor(crew.id, studentId, 'Rota'), duration_minutes: 0 }]
    const rejected = await trainer.client.rpc('create_sessions', {
      batch: broken,
      source_assignment: assignment?.id,
    })
    expect(rejected.error?.code).toBe('23514')

    const { data: stored } = await adminClient().from('sessions').select('id').eq('assignment_id', assignment?.id)
    expect(stored).toHaveLength(2)
  })
})

describe('sessions: mover un volcado', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('mueve las que quedan por hacer y deja quietas las hechas y las canceladas', async () => {
    const trainer = await signedInAs('mueve', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Movidas')
    const person = await signedInAs('movido', { intent: 'student', first_name: 'M', last_name: 'O' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    const { data: plan } = await trainer.client
      .from('plans')
      .insert({
        crew_id: crew.id,
        title: 'Plan',
        level: 'Principiante',
        objective_id: 'hipertrofia',
        split_id: 'full-body',
        weekly_frequency: 3,
        weeks: [{ number: 1, isDeload: false, days: [{ dayOfWeek: 1, routineId: null }] }],
      })
      .select('id')
      .single()
    const { data: assignment } = await trainer.client
      .from('assignments')
      .insert({ crew_id: crew.id, student_id: studentId, kind: 'plan', plan_id: plan?.id })
      .select('id')
      .single()

    // Fechas relativas a hoy: la regla mira `current_date`.
    const soon = dayKey(3)
    const past = dayKey(-3)
    await trainer.client.rpc('create_sessions', {
      batch: [
        { ...sessionFor(crew.id, studentId, 'Pendiente'), date: soon },
        { ...sessionFor(crew.id, studentId, 'Hecha'), status: 'completed', date: soon },
        { ...sessionFor(crew.id, studentId, 'Cancelada'), status: 'cancelled', date: soon },
        // Abierta y con el dia pasado: «no ocurrio», y se queda donde esta.
        { ...sessionFor(crew.id, studentId, 'No ocurrio'), date: past },
      ],
      source_assignment: assignment?.id,
    })

    const { data: moved, error } = await trainer.client.rpc('shift_sessions', {
      source_assignment: assignment?.id,
      days: 7,
    })
    expect(error).toBeNull()
    expect(moved).toBe(1)

    const { data: rows } = await adminClient()
      .from('sessions')
      .select('title, date')
      .eq('assignment_id', assignment?.id)
      .order('title')
    expect(rows).toEqual([
      { title: 'Cancelada', date: soon },
      { title: 'Hecha', date: soon },
      { title: 'No ocurrio', date: past },
      { title: 'Pendiente', date: dayKey(10) },
    ])

    // Un alumno no mueve un volcado: la funcion corre con sus permisos, y el
    // guardian de la sesion le corta el cambio de fecha.
    const denied = await person.client.rpc('shift_sessions', {
      source_assignment: assignment?.id,
      days: 7,
    })
    expect(denied.error?.message).toBe('forbidden')
  })
})
