import { afterAll, describe, expect, it } from 'vitest'
import { adminClient, deleteAccounts, signedInAs, type TestAccount } from './supabase'
import { ROUTE_BY_OBJECTIVE, ROUTE_NODES } from '@/shared/domain/entities/progress'

/**
 * Rutas de desarrollo y la mano del entrenador: la ruta sale del plan, el
 * nodo se calcula con tres criterios, y validar -hitos, insignias, cargas-
 * solo lo hace quien tiene `students.manage`.
 */

interface CrewRow {
  id: string
}

interface RouteProgressRow {
  route_code: string
  node_position: number
  points: number
  adherent_weeks: number
  validated_positions: number[]
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

async function progressOf(account: TestAccount, studentId: string): Promise<RouteProgressRow> {
  const { data, error } = await account.client.rpc('route_progress', { student: studentId })
  if (error !== null) throw new Error(`route_progress: ${error.message}`)
  return (data as RouteProgressRow[])[0]
}

describe('rutas: el catalogo de la base es el del codigo', () => {
  it('nodos y objetivos coinciden con las constantes', async () => {
    const { data: nodes } = await adminClient().from('route_nodes').select('route_code, node_position, points_required, weeks_required')
    const rows = (nodes ?? []) as { route_code: string; node_position: number; points_required: number; weeks_required: number }[]
    for (const route of ['titan', 'endurance', 'apex', 'vitality', 'hybrid']) {
      const own = rows.filter((row) => row.route_code === route).sort((left, right) => left.node_position - right.node_position)
      expect(own.map((row) => [row.node_position, row.points_required, row.weeks_required])).toEqual(
        ROUTE_NODES.map((node) => [node.position, node.pointsRequired, node.weeksRequired])
      )
    }

    const { data: objectives } = await adminClient().from('route_objectives').select('objective_id, route_code')
    const mapping = Object.fromEntries(((objectives ?? []) as { objective_id: string; route_code: string }[]).map((row) => [row.objective_id, row.route_code]))
    expect(mapping).toEqual(ROUTE_BY_OBJECTIVE)
  })
})

describe('rutas: donde esta cada alumno', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('sin plan es Hybrid; con un plan de fuerza, Titan; y el nodo sube solo con las tres cosas', async () => {
    const trainer = await signedInAs('rutas', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Con rutas')
    const person = await signedInAs('rutera', { intent: 'student', first_name: 'R', last_name: 'U' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    expect(await progressOf(person, studentId)).toMatchObject({ route_code: 'hybrid', node_position: 1, points: 0 })

    // Un plan de fuerza maxima asignado: la ruta cambia sola.
    const { data: plan } = await trainer.client
      .from('plans')
      .insert({ crew_id: crew.id, title: 'Fuerza', objective_id: 'fuerza-maxima', split_id: 'full-body', weekly_frequency: 3, level: 'Intermedio', weeks: [{ number: 1, isDeload: false, days: [] }] })
      .select('id')
      .single()
    await trainer.client.from('assignments').insert({
      crew_id: crew.id, student_id: studentId, kind: 'plan', plan_id: plan?.id, assigned_on: '2026-09-01',
    })
    expect((await progressOf(trainer, studentId)).route_code).toBe('titan')

    // Puntos y semanas de sobra: 20 sesiones de 20 series en semanas seguidas.
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const rows: Record<string, unknown>[] = []
    for (let week = 0; week < 5; week += 1) {
      for (let day = 0; day < 4; day += 1) {
        const date = new Date(monday)
        date.setDate(monday.getDate() - week * 7 + day)
        if (date > new Date()) continue
        const key = date.toISOString().slice(0, 10)
        rows.push({
          crew_id: crew.id, student_id: studentId, title: `S ${key}`, kind: 'individual', modality: 'strength',
          date: key, time: '09:00', duration_minutes: 60, status: 'completed',
          result: { completedSets: 20, totalSets: 20, elapsedSeconds: 3000, completedAt: key },
        })
      }
    }
    const inserted = await trainer.client.from('sessions').insert(rows)
    expect(inserted.error).toBeNull()

    const before = await progressOf(person, studentId)
    expect(before.points).toBeGreaterThanOrEqual(300)
    expect(before.adherent_weeks).toBeGreaterThanOrEqual(4)
    // Sin validacion, sigue en Iniciacion.
    expect(before.node_position).toBe(1)

    // El alumno no se valida a si mismo.
    const forged = await person.client.rpc('validate_milestone', { student: studentId, route: 'titan', node: 2 })
    expect(forged.error?.message).toBe('forbidden')

    const validated = await trainer.client.rpc('validate_milestone', {
      student: studentId, route: 'titan', node: 2, validation_notes: 'Sentadilla limpia',
    })
    expect(validated.error).toBeNull()
    const after = await progressOf(person, studentId)
    expect(after.node_position).toBe(2)
    expect(after.validated_positions).toEqual([2])

    // Cambiar la ruta a mano reinicia los puntos de la ruta, y solo lo hace quien gestiona.
    const denied = await person.client.rpc('choose_route', { student: studentId, route: 'apex' })
    expect(denied.error?.message).toBe('forbidden')
    const chosen = await trainer.client.rpc('choose_route', { student: studentId, route: 'apex' })
    expect(chosen.error).toBeNull()
    const apex = await progressOf(person, studentId)
    expect(apex.route_code).toBe('apex')
    expect(apex.node_position).toBe(1)
  })

  it('cinco hitos validados dan el sello del entrenador', async () => {
    const trainer = await signedInAs('sello', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Con sello')
    const person = await signedInAs('sellada', { intent: 'student', first_name: 'S', last_name: 'E' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    const validations: [string, number][] = [['hybrid', 2], ['hybrid', 3], ['hybrid', 4], ['titan', 2], ['titan', 3]]
    for (const [route, node] of validations) {
      const { error } = await trainer.client.rpc('validate_milestone', { student: studentId, route, node })
      expect(error).toBeNull()
    }
    const { data } = await adminClient().from('student_badges').select('badge_code').eq('student_id', studentId)
    expect(data?.map((row) => row.badge_code)).toContain('coach-seal')
  })
})

describe('el entrenador confirma insignias y revisa cargas', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('una insignia pendiente la confirma quien gestiona; el alumno no', async () => {
    const trainer = await signedInAs('confirma', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Confirmable')
    const person = await signedInAs('confirmada', { intent: 'student', first_name: 'C', last_name: 'O' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    // Una de Platino, plantada con el rol de servicio: conseguirla de verdad
    // son cien dias seguidos.
    await adminClient().from('student_badges').insert({ student_id: studentId, badge_code: 'legend', unlocked_on: '2026-09-01' })

    const denied = await person.client.rpc('validate_badge', { student: studentId, code: 'legend' })
    expect(denied.error?.message).toBe('forbidden')

    const confirmed = await trainer.client.rpc('validate_badge', { student: studentId, code: 'legend' })
    expect(confirmed.error).toBeNull()
    const { data } = await adminClient().from('student_badges').select('validated_at, validated_by').eq('student_id', studentId).eq('badge_code', 'legend').single()
    expect(data?.validated_at).not.toBeNull()
    expect(data?.validated_by).toBe(trainer.id)

    // Confirmarla dos veces no encuentra nada.
    const again = await trainer.client.rpc('validate_badge', { student: studentId, code: 'legend' })
    expect(again.error?.message).toBe('notFound')
  })

  it('un salto de carga del 20 % se marca sin progreso, y aceptarlo repuntua', async () => {
    const trainer = await signedInAs('salto', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Con saltos')
    const person = await signedInAs('saltadora', { intent: 'student', first_name: 'S', last_name: 'A' })
    created.push(trainer, person)
    const studentId = await enrollAs(trainer, crew.id, person)

    const close = async (day: string, weight: number): Promise<string> => {
      const { data } = await trainer.client
        .from('sessions')
        .insert({ crew_id: crew.id, student_id: studentId, title: day, kind: 'individual', modality: 'strength', date: day, time: '09:00', duration_minutes: 60 })
        .select('id')
        .single()
      const closed = await person.client.rpc('complete_session', {
        session: data?.id,
        session_result: {
          completedSets: 3, totalSets: 3, elapsedSeconds: 1800, completedAt: day,
          sets: [{ exerciseId: 'press', repsDone: 8, workSeconds: 30, weightKg: weight }],
        },
      })
      expect(closed.error).toBeNull()
      return data?.id as string
    }

    await close('2026-08-10', 60)
    await close('2026-08-17', 60)
    // 80 sobre una mediana de 60: mas de un 20 %.
    const jump = await close('2026-08-24', 80)

    const { data: flagged } = await adminClient().from('session_scores').select('flagged_reason, progress, points').eq('session_id', jump).single()
    expect(flagged).toMatchObject({ flagged_reason: 'load_jump', points: 23 })
    expect(Number(flagged?.progress)).toBe(1)

    const denied = await person.client.rpc('accept_load_jump', { session: jump })
    expect(denied.error?.message).toBe('forbidden')

    const accepted = await trainer.client.rpc('accept_load_jump', { session: jump })
    expect(accepted.error).toBeNull()
    const { data: reviewed } = await adminClient().from('session_scores').select('flagged_reason, progress, points, reviewed_by').eq('session_id', jump).single()
    expect(reviewed?.flagged_reason).toBeNull()
    expect(Number(reviewed?.progress)).toBe(1.15)
    expect(reviewed?.points).toBe(26)
    expect(reviewed?.reviewed_by).toBe(trainer.id)
  })
})
