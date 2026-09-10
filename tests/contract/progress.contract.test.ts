import { afterAll, describe, expect, it } from 'vitest'
import { adminClient, deleteAccounts, signedInAs, type TestAccount } from './supabase'
import { BADGE_CODES, badgeCatalog } from '@/domains/progress/data/badgeCatalog'

/**
 * Motores de progreso: la puntuacion y las insignias las decide la base.
 *
 * Lo que se afirma aqui es que CERRAR UNA SESION PUNTUA Y EVALUA en la misma
 * transaccion, por disparador, con la regla version 1; que nadie escribe esas
 * tablas desde la API; y que cada uno lee solo lo suyo. El espejo simulado de
 * la regla tiene su prueba unitaria; si divergen, manda esta.
 */

interface CrewRow {
  id: string
}

interface ScoreRow {
  session_id: string
  base: string | number
  adherence: string | number
  progress: string | number
  cohort: string | number
  points: number
  rule_version: number
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

function sessionFor(
  crewId: string,
  studentId: string | null,
  title: string,
  date: string,
  modality: 'strength' | 'cardio' = 'strength'
): Record<string, unknown> {
  return {
    crew_id: crewId,
    student_id: studentId,
    title,
    kind: studentId === null ? 'group' : 'individual',
    modality,
    date,
    time: '09:00',
    duration_minutes: 60,
  }
}

async function insertSession(trainer: TestAccount, row: Record<string, unknown>): Promise<string> {
  const { data, error } = await trainer.client.from('sessions').insert(row).select('id').single()
  if (error !== null) throw new Error(`sessions.insert: ${error.message}`)
  return data.id as string
}

async function scoreOf(sessionId: string): Promise<ScoreRow | null> {
  const { data } = await adminClient().from('session_scores').select('*').eq('session_id', sessionId).maybeSingle()
  return data as ScoreRow | null
}

describe('puntuacion: cerrar una sesion la puntua, con la regla 1', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('base 20 + series, adherencia acotada, progreso 1 sin referencia, cohorte 1 sin fecha', async () => {
    const trainer = await signedInAs('puntua', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Puntuable')
    const person = await signedInAs('puntuada', { intent: 'student', first_name: 'P', last_name: 'U' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    // Entera: 9 de 9 -> 29 puntos.
    const full = await insertSession(trainer, sessionFor(crew.id, studentId, 'Entera', '2026-09-01'))
    const closedFull = await person.client.rpc('complete_session', {
      session: full,
      session_result: { completedSets: 9, totalSets: 9, elapsedSeconds: 2700, completedAt: '2026-09-01' },
    })
    expect(closedFull.error).toBeNull()
    const fullScore = await scoreOf(full)
    expect(fullScore).toMatchObject({ points: 29, rule_version: 1 })
    expect(Number(fullScore?.base)).toBe(29)
    expect(Number(fullScore?.adherence)).toBe(1)
    expect(Number(fullScore?.progress)).toBe(1)
    expect(Number(fullScore?.cohort)).toBe(1)

    // A medias: 5 de 12 -> adherencia al suelo de 0,80, base 25 -> 20 puntos.
    const half = await insertSession(trainer, sessionFor(crew.id, studentId, 'A medias', '2026-09-02'))
    await person.client.rpc('complete_session', {
      session: half,
      session_result: { completedSets: 5, totalSets: 12, elapsedSeconds: 1200, completedAt: '2026-09-02' },
    })
    const halfScore = await scoreOf(half)
    expect(Number(halfScore?.adherence)).toBe(0.8)
    expect(halfScore?.points).toBe(20)

    // Pasarse del plan no suma mas que cumplirlo: 14 de 12 -> base 32, adherencia 1,10 -> 35.
    const over = await insertSession(trainer, sessionFor(crew.id, studentId, 'De mas', '2026-09-03'))
    await person.client.rpc('complete_session', {
      session: over,
      session_result: { completedSets: 14, totalSets: 12, elapsedSeconds: 3000, completedAt: '2026-09-03' },
    })
    const overScore = await scoreOf(over)
    expect(Number(overScore?.adherence)).toBe(1.1)
    expect(overScore?.points).toBe(35)

    // Cardio: 40 de 60 minutos -> base 28, adherencia 0,80 -> 22.
    const run = await insertSession(trainer, sessionFor(crew.id, studentId, 'Carrera', '2026-09-04', 'cardio'))
    await person.client.rpc('complete_session', {
      session: run,
      session_result: { completedSets: 0, totalSets: 0, elapsedSeconds: 2400, completedAt: '2026-09-04' },
    })
    const runScore = await scoreOf(run)
    expect(Number(runScore?.base)).toBe(28)
    expect(runScore?.points).toBe(22)

    // Una grupal no puntua a nadie.
    const group = await insertSession(trainer, sessionFor(crew.id, null, 'Clase', '2026-09-05'))
    await trainer.client.rpc('complete_session', {
      session: group,
      session_result: { completedSets: 0, totalSets: 0, elapsedSeconds: 3600, completedAt: '2026-09-05' },
    })
    expect(await scoreOf(group)).toBeNull()

    // Y el ranking suma puntos, no series: 29 + 20 + 35 + 22.
    const { data: ranking } = await person.client.rpc('crew_ranking', { crew: crew.id, period: 'all' })
    const mine = (ranking as { student_id: string; experience: number; completed_sessions: number }[]).find(
      (row) => row.student_id === studentId
    )
    expect(mine).toMatchObject({ experience: 106, completed_sessions: 4 })
  })

  it('el progreso premia mejorar la carga sobre las cuatro semanas anteriores, salvo forzado', async () => {
    const trainer = await signedInAs('progresa', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Progresivo')
    const person = await signedInAs('progresada', { intent: 'student', first_name: 'P', last_name: 'R' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    const closeWith = async (day: string, weight: number, rpe?: number): Promise<ScoreRow | null> => {
      const id = await insertSession(trainer, sessionFor(crew.id, studentId, `Press ${day}`, day))
      const set: Record<string, unknown> = { exerciseId: 'press', repsDone: 8, workSeconds: 30, weightKg: weight }
      if (rpe !== undefined) set.rpe = rpe
      const closed = await person.client.rpc('complete_session', {
        session: id,
        session_result: { completedSets: 3, totalSets: 3, elapsedSeconds: 1800, completedAt: day, sets: [set] },
      })
      expect(closed.error).toBeNull()
      return scoreOf(id)
    }

    // Sin referencia todavia: 1,00.
    expect(Number((await closeWith('2026-08-10', 60))?.progress)).toBe(1)
    // Mas carga que la mediana (60): 1,15.
    expect(Number((await closeWith('2026-08-17', 62.5))?.progress)).toBe(1.15)
    // Forzada: mas carga que la mediana (61,25) pero con RPE 9 no cuenta.
    expect(Number((await closeWith('2026-08-24', 65, 9))?.progress)).toBe(1)
    // Limpia otra vez, por encima de la mediana de las tres anteriores (62,5): 1,15.
    expect(Number((await closeWith('2026-08-31', 67.5, 8))?.progress)).toBe(1.15)
  })

  it('la cohorte sale de la fecha de nacimiento y el nivel', async () => {
    const trainer = await signedInAs('cohorte', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Cohortes')
    const young = await signedInAs('joven', { intent: 'student', first_name: 'J', last_name: 'O' })
    const senior = await signedInAs('senior', { intent: 'student', first_name: 'S', last_name: 'E' })
    const elite = await signedInAs('elite', { intent: 'student', first_name: 'E', last_name: 'L' })
    created.push(trainer, young, senior, elite)

    const year = new Date().getFullYear()
    const youngId = await enrollAs(trainer, crew.id, young, { birth_date: `${year - 15}-01-01` })
    const seniorId = await enrollAs(trainer, crew.id, senior, { birth_date: `${year - 60}-01-01` })
    const eliteId = await enrollAs(trainer, crew.id, elite, { birth_date: `${year - 30}-01-01`, level: 'Avanzado' })

    const expectations: [string, number][] = [
      [youngId, 1.15],
      [seniorId, 1.2],
      [eliteId, 0.85],
    ]
    for (const [studentId, cohort] of expectations) {
      const id = await insertSession(trainer, sessionFor(crew.id, studentId, 'Cohorte', '2026-09-01'))
      await trainer.client.rpc('complete_session', {
        session: id,
        session_result: { completedSets: 10, totalSets: 10, elapsedSeconds: 1800, completedAt: '2026-09-01' },
      })
      const score = await scoreOf(id)
      expect(Number(score?.cohort)).toBe(cohort)
      expect(score?.points).toBe(Math.round(30 * cohort))
    }
  })

  it('reabrir la sesion borra su puntuacion; nadie escribe puntuaciones desde la API', async () => {
    const trainer = await signedInAs('reabre', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Reabrible')
    const person = await signedInAs('reabierta', { intent: 'student', first_name: 'R', last_name: 'E' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    const id = await insertSession(trainer, sessionFor(crew.id, studentId, 'Cerrada', '2026-09-01'))
    await trainer.client.rpc('complete_session', {
      session: id,
      session_result: { completedSets: 4, totalSets: 4, elapsedSeconds: 900, completedAt: '2026-09-01' },
    })
    expect((await scoreOf(id))?.points).toBe(24)

    await trainer.client.from('sessions').update({ status: 'confirmed' }).eq('id', id)
    expect(await scoreOf(id)).toBeNull()

    // 42501: la tabla no tiene politica de escritura para nadie.
    const forged = await trainer.client.from('session_scores').insert({
      session_id: id, crew_id: crew.id, student_id: studentId, completed_on: '2026-09-01',
      base: 999, adherence: 1, progress: 1, cohort: 1, points: 999, rule_version: 1,
    })
    expect(forged.error?.code).toBe('42501')
  })

  it('cada alumno lee sus puntuaciones y sus insignias; las de otro, no', async () => {
    const trainer = await signedInAs('lee', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Lectura')
    const one = await signedInAs('lectora', { intent: 'student', first_name: 'L', last_name: 'E' })
    const other = await signedInAs('ajena', { intent: 'student', first_name: 'A', last_name: 'J' })
    created.push(trainer, one, other)
    const oneId = await enrollAs(trainer, crew.id, one)
    await enrollAs(trainer, crew.id, other)

    const id = await insertSession(trainer, sessionFor(crew.id, oneId, 'Suya', '2026-09-01'))
    await one.client.rpc('complete_session', {
      session: id,
      session_result: { completedSets: 6, totalSets: 6, elapsedSeconds: 1500, completedAt: '2026-09-01' },
    })

    const { data: ownScores } = await one.client.from('session_scores').select('session_id')
    expect(ownScores).toHaveLength(1)
    const { data: ownBadges } = await one.client.from('student_badges').select('badge_code')
    expect(ownBadges?.map((row) => row.badge_code)).toContain('first-session')

    const { data: strangerScores } = await other.client.from('session_scores').select('session_id')
    expect(strangerScores).toHaveLength(0)
    const { data: strangerBadges } = await other.client.from('student_badges').select('badge_code')
    expect(strangerBadges).toHaveLength(0)

    // El entrenador ve las de todo su equipo.
    const { data: staffScores } = await trainer.client.from('session_scores').select('session_id')
    expect(staffScores).toHaveLength(1)
  })
})

describe('insignias: se desbloquean al cerrar, con la sesion que las gano', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('el catalogo de la base y el de presentacion tienen los mismos codigos, rarezas y validaciones', async () => {
    const { data } = await adminClient().from('badge_definitions').select('code, rarity, category, requires_validation')
    const rows = (data ?? []) as { code: string; rarity: string; category: string; requires_validation: boolean }[]

    expect(rows.map((row) => row.code).sort()).toEqual([...BADGE_CODES].sort())
    for (const definition of badgeCatalog) {
      const row = rows.find((candidate) => candidate.code === definition.code)
      expect(row, definition.code).toMatchObject({
        rarity: definition.rarity,
        category: definition.category,
        requires_validation: definition.requiresValidation,
      })
    }
  })

  it('la primera sesion desbloquea «primera sesion» y, con peso, «primer kilo»; la segunda no las repite', async () => {
    const trainer = await signedInAs('insignia', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Con insignias')
    const person = await signedInAs('insigne', { intent: 'student', first_name: 'I', last_name: 'N' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    const first = await insertSession(trainer, sessionFor(crew.id, studentId, 'Primera', '2026-09-01'))
    await person.client.rpc('complete_session', {
      session: first,
      session_result: {
        completedSets: 3, totalSets: 3, elapsedSeconds: 900, completedAt: '2026-09-01',
        sets: [{ exerciseId: 'press', repsDone: 8, workSeconds: 30, weightKg: 40 }],
      },
    })

    const { data: afterFirst } = await adminClient()
      .from('student_badges')
      .select('badge_code, unlocked_on, session_id, validated_at')
      .eq('student_id', studentId)
      .order('badge_code')
    expect(afterFirst).toEqual([
      { badge_code: 'first-session', unlocked_on: '2026-09-01', session_id: first, validated_at: null },
      { badge_code: 'first-weight', unlocked_on: '2026-09-01', session_id: first, validated_at: null },
    ])

    const second = await insertSession(trainer, sessionFor(crew.id, studentId, 'Segunda', '2026-09-02'))
    await person.client.rpc('complete_session', {
      session: second,
      session_result: { completedSets: 3, totalSets: 3, elapsedSeconds: 900, completedAt: '2026-09-02' },
    })
    const { data: afterSecond } = await adminClient()
      .from('student_badges')
      .select('badge_code, session_id')
      .eq('student_id', studentId)
    // Siguen siendo dos, y siguen apuntando a la primera sesion.
    expect(afterSecond).toHaveLength(2)
    expect(afterSecond?.every((row) => row.session_id === first)).toBe(true)

    // Y nadie las escribe desde la API.
    const forged = await person.client.from('student_badges').insert({
      student_id: studentId, badge_code: 'legend', unlocked_on: '2026-09-02',
    })
    expect(forged.error?.code).toBe('42501')
  })

  it('siete dias seguidos desbloquean «semana perfecta» el septimo dia, no hoy', async () => {
    const trainer = await signedInAs('racha', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Rachas')
    const person = await signedInAs('rachera', { intent: 'student', first_name: 'R', last_name: 'A' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    for (let day = 1; day <= 7; day += 1) {
      const date = `2026-08-0${day}`
      const id = await insertSession(trainer, sessionFor(crew.id, studentId, `Dia ${day}`, date))
      await trainer.client.rpc('complete_session', {
        session: id,
        session_result: { completedSets: 2, totalSets: 2, elapsedSeconds: 600, completedAt: date },
      })
    }

    const { data } = await adminClient()
      .from('student_badges')
      .select('unlocked_on')
      .eq('student_id', studentId)
      .eq('badge_code', 'perfect-week')
      .single()
    expect(data?.unlocked_on).toBe('2026-08-07')
  })
})
