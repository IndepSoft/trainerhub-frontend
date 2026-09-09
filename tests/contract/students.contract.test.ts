import { afterAll, describe, expect, it } from 'vitest'
import { adminClient, deleteAccounts, signedInAs, type TestAccount } from './supabase'

/**
 * Alumnos y pertenencia: la libreta del entrenador, el alta que enlaza, y lo
 * que un alumno puede y no puede tocar de su propia ficha.
 */

interface CrewRow {
  id: string
  join_token: string
}

async function createActiveCrewAs(account: TestAccount, name: string): Promise<CrewRow> {
  const { data, error } = await account.client.rpc('create_crew', {
    crew_name: name,
    crew_denomination: 'Crew',
  })
  if (error !== null) throw new Error(`create_crew: ${error.message}`)
  const crew = data as CrewRow
  // Solo la plataforma activa la suscripcion; aqui lo hace el rol de servicio.
  await adminClient().from('crews').update({ subscription_status: 'active' }).eq('id', crew.id)
  return crew
}

describe('students: la ficha y quien la escribe', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('el entrenador crea la ficha; el alumno solo cambia su nombre y su foto', async () => {
    const trainer = await signedInAs('libreta', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Libreta')
    const person = await signedInAs('ficha', { intent: 'student', first_name: 'P', last_name: 'E' })
    created.push(trainer, person)

    const { data: ficha, error } = await trainer.client
      .from('students')
      .insert({
        crew_id: crew.id,
        profile_id: person.id,
        first_name: 'Pepa',
        last_name: 'Ejemplo',
        email: person.email,
        level: 'Intermedio',
        age: 30,
        body_fat_percentage: 21.5,
        membership_status: 'active',
      })
      .select('id')
      .single()
    expect(error).toBeNull()

    // Su nombre, si.
    const rename = await person.client
      .from('students')
      .update({ first_name: 'Pepa Renombrada' })
      .eq('id', ficha?.id)
    expect(rename.error).toBeNull()

    // Su nivel, no: es la valoracion del entrenador. Lo corta el disparador.
    const level = await person.client.from('students').update({ level: 'Avanzado' }).eq('id', ficha?.id)
    expect(level.error?.message).toBe('forbidden')

    // Ni aprobarse a si mismo ni concederse capacidades.
    const caps = await person.client
      .from('students')
      .update({ extra_capabilities: ['schedule.manage'] })
      .eq('id', ficha?.id)
    expect(caps.error?.message).toBe('forbidden')
  })

  it('un alumno ve su ficha y no las de los demas; el equipo tecnico las ve todas', async () => {
    const trainer = await signedInAs('padron', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Padron')
    const one = await signedInAs('uno', { intent: 'student', first_name: 'U', last_name: 'N' })
    const two = await signedInAs('dos', { intent: 'student', first_name: 'D', last_name: 'O' })
    created.push(trainer, one, two)

    await trainer.client.from('students').insert([
      { crew_id: crew.id, profile_id: one.id, email: one.email, membership_status: 'active' },
      { crew_id: crew.id, profile_id: two.id, email: two.email, membership_status: 'active' },
    ])

    const seenByOne = await one.client.from('students').select('email').eq('crew_id', crew.id)
    expect(seenByOne.data?.map((row) => row.email)).toEqual([one.email])

    const seenByTrainer = await trainer.client.from('students').select('email').eq('crew_id', crew.id)
    expect(seenByTrainer.data).toHaveLength(2)
  })
})

describe('students: el alta que enlaza, en el servidor', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('quien se registra con un correo invitado entra a su equipo sin hacer nada', async () => {
    const trainer = await signedInAs('invita', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Invitaciones')
    created.push(trainer)

    // El entrenador crea la ficha ANTES de que exista la cuenta. En mayusculas
    // distintas a proposito: el enlace no puede depender de eso.
    const invitedEmail = `Invitada-${Date.now()}@Contrato.local`
    await trainer.client.from('students').insert({
      crew_id: crew.id,
      first_name: 'Ines',
      last_name: 'Invitada',
      email: invitedEmail,
      membership_status: 'invited',
    })

    // La persona se registra con ese correo. El disparador del alta la enlaza.
    const admin = adminClient()
    const signup = await admin.auth.admin.createUser({
      email: invitedEmail.toLowerCase(),
      password: 'contrato-secreto-123',
      email_confirm: true,
      user_metadata: { intent: 'student', first_name: 'Ines', last_name: 'Invitada' },
    })
    // Si el disparador del alta falla, el alta entera falla: hay que decirlo
    // aqui, y no en una comparacion de fichas tres lineas mas abajo.
    expect(signup.error).toBeNull()
    const personId = signup.data.user?.id ?? ''
    created.push({ id: personId, email: invitedEmail, client: admin })

    const { data } = await admin
      .from('students')
      .select('profile_id, membership_status')
      .eq('crew_id', crew.id)
      .single()
    expect(data).toEqual({ profile_id: personId, membership_status: 'active' })
  })

  it('el codigo de equipo escrito en el alta se honra, y uno malo no tumba el alta', async () => {
    const trainer = await signedInAs('codigo', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Con codigo')
    created.push(trainer)

    const admin = adminClient()
    const good = await admin.auth.admin.createUser({
      email: `con-codigo-${Date.now()}@contrato.local`,
      password: 'contrato-secreto-123',
      email_confirm: true,
      user_metadata: { intent: 'student', first_name: 'C', last_name: 'B', join_code: crew.join_token },
    })
    created.push({ id: good.data.user?.id ?? '', email: '', client: admin })

    const { data: pending } = await admin
      .from('students')
      .select('membership_status')
      .eq('crew_id', crew.id)
      .eq('profile_id', good.data.user?.id)
      .single()
    // El equipo pide aprobacion: queda en espera, no dentro.
    expect(pending?.membership_status).toBe('pending')

    const bad = await admin.auth.admin.createUser({
      email: `mal-codigo-${Date.now()}@contrato.local`,
      password: 'contrato-secreto-123',
      email_confirm: true,
      user_metadata: { intent: 'student', first_name: 'M', last_name: 'C', join_code: 'NOEXISTE' },
    })
    expect(bad.error).toBeNull()
    created.push({ id: bad.data.user?.id ?? '', email: '', client: admin })
  })

  it('unirse por token respeta la suscripcion y no duplica la ficha', async () => {
    const trainer = await signedInAs('token', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Por token')
    const person = await signedInAs('escanea', { intent: 'student', first_name: 'E', last_name: 'S' })
    created.push(trainer, person)

    // Ficha previa con su correo: se reclama ESA, no se abre otra.
    await trainer.client.from('students').insert({
      crew_id: crew.id,
      first_name: 'Antes',
      last_name: 'Creada',
      email: person.email,
      membership_status: 'invited',
    })

    const joined = await person.client.rpc('claim_membership', { crew_token: crew.join_token })
    expect(joined.error).toBeNull()
    expect(joined.data).toMatchObject({ profile_id: person.id, first_name: 'Antes' })

    const { count } = await adminClient()
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('crew_id', crew.id)
    expect(count).toBe(1)

    // Con la suscripcion suspendida, la puerta esta cerrada.
    await adminClient().from('crews').update({ subscription_status: 'suspended' }).eq('id', crew.id)
    const other = await signedInAs('tarde', { intent: 'student', first_name: 'T', last_name: 'A' })
    created.push(other)
    const closed = await other.client.rpc('claim_membership', { crew_token: crew.join_token })
    expect(closed.error?.message).toBe('enrollmentClosed')
  })
})

describe('students: una solicitud pendiente la retira quien la hizo', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('el solicitante borra su ficha pendiente; la activa y las ajenas, no', async () => {
    const trainer = await signedInAs('retiro', { intent: 'trainer', first_name: 'T', last_name: 'R' })
    const crew = await createActiveCrewAs(trainer, 'Con puerta')
    const waiting = await signedInAs('espera', { intent: 'student', first_name: 'E', last_name: 'S' })
    const other = await signedInAs('otro', { intent: 'student', first_name: 'O', last_name: 'T' })
    created.push(trainer, waiting, other)

    // El equipo pide aprobacion: las dos solicitudes quedan pendientes.
    const first = await waiting.client.rpc('claim_membership', { crew_token: crew.join_token })
    const second = await other.client.rpc('claim_membership', { crew_token: crew.join_token })
    expect(first.error).toBeNull()
    expect(second.error).toBeNull()
    const waitingId = (first.data as { id: string }).id
    const otherId = (second.data as { id: string }).id

    // La ajena no se toca: el borrado no alcanza ninguna fila.
    await waiting.client.from('students').delete().eq('id', otherId)
    const { count: stillThere } = await adminClient()
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('id', otherId)
    expect(stillThere).toBe(1)

    // La propia, pendiente, si.
    const withdrawn = await waiting.client.from('students').delete().eq('id', waitingId)
    expect(withdrawn.error).toBeNull()
    const { count: gone } = await adminClient()
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('id', waitingId)
    expect(gone).toBe(0)

    // Aprobada, ya no es una solicitud: darse de baja es otra decision.
    await adminClient().from('students').update({ membership_status: 'active' }).eq('id', otherId)
    await other.client.from('students').delete().eq('id', otherId)
    const { count: kept } = await adminClient()
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('id', otherId)
    expect(kept).toBe(1)
  })
})

describe('platform: solo quien administra', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('las funciones de plataforma rechazan a quien no administra', async () => {
    const someone = await signedInAs('nadie', { intent: 'trainer', first_name: 'N', last_name: 'A' })
    created.push(someone)

    const crews = await someone.client.rpc('platform_list_crews')
    expect(crews.error?.message).toBe('forbidden')

    const users = await someone.client.rpc('platform_list_users', {
      page: 1,
      page_size: 20,
      search: '',
      role_filter: null,
    })
    expect(users.error?.message).toBe('forbidden')
  })
})
