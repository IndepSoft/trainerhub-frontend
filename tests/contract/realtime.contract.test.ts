import { afterAll, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { adminClient, deleteAccounts, signedInAs, type TestAccount } from './supabase'

/**
 * Tiempo real: que lo publicado emita, y que solo emita a quien puede leerlo.
 *
 * ES LA PRUEBA QUE FALTABA CUANDO SE ROMPIO. La aplicacion llevaba treinta
 * hooks suscritos a tablas que nadie habia publicado, y como no avisar es una
 * implementacion sintacticamente valida del contrato, ni el compilador ni el
 * lint ni las pruebas de interfaz -que corren contra los adaptadores simulados,
 * donde el aviso es una llamada en memoria- tenian forma de notarlo. Solo se
 * veia abriendo la aplicacion y recargando a mano.
 *
 * Por eso esto se comprueba CONTRA LA BASE y con un canal de verdad: lo que se
 * afirma aqui es que el servidor emite, no que el cliente llame bien.
 */

const ESPERA_MAXIMA_MS = 10_000

/** Lo que se espera cuando se afirma que algo NO llega. Ver `no se entera`. */
const ESPERA_DEL_SILENCIO_MS = 4_000

interface Watcher {
  /** Resuelve cuando el canal esta escuchando de verdad. */
  ready: Promise<void>
  /** `true` si llego algun cambio antes del limite. */
  next(limitMs?: number): Promise<boolean>
  close(): Promise<void>
}

/**
 * Escucha una tabla y deja preguntar si llego algo.
 *
 * Se espera a `ready` ANTES de escribir. Suscribirse es un viaje de ida y
 * vuelta por websocket, y escribir antes de que termine haria una prueba que
 * pasa o falla segun lo cargada que este la maquina.
 */
function watch(client: SupabaseClient, table: string): Watcher {
  let announceReady = (): void => undefined
  const ready = new Promise<void>((resolve) => {
    announceReady = resolve
  })

  let received = 0
  let waiting: (() => void) | null = null

  const channel = client
    .channel(`contrato:${table}:${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      received += 1
      waiting?.()
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') announceReady()
    })

  return {
    ready,
    async next(limitMs = ESPERA_MAXIMA_MS): Promise<boolean> {
      // Puede haber llegado ya, entre la escritura y esta pregunta.
      if (received > 0) return true

      return await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => {
          waiting = null
          resolve(false)
        }, limitMs)

        waiting = () => {
          clearTimeout(timer)
          waiting = null
          resolve(true)
        }
      })
    },
    async close(): Promise<void> {
      await client.removeChannel(channel)
    },
  }
}

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
  // Sin suscripcion activa no se puede dar de alta a nadie: lo corta
  // `enrollmentClosed` en el servidor.
  await adminClient().from('crews').update({ subscription_status: 'active' }).eq('id', crew.id)
  return crew
}

describe('tiempo real: lo publicado emite y RLS decide a quien', () => {
  const created: TestAccount[] = []
  afterAll(() => deleteAccounts(created))

  it('fundar un equipo avisa a quien lo funda, sin recargar', async () => {
    const founder = await signedInAs('tiempo-real-funda', {
      intent: 'trainer',
      first_name: 'Fundadora',
      last_name: 'Prueba',
    })
    created.push(founder)

    /*
     * EL CASO QUE SE ROMPIO. `useViewer` escucha `crews` para enterarse del
     * equipo que acaba de nacer, y no habia canal: la barra lateral seguia
     * diciendo «Sin equipo» hasta recargar.
     *
     * Que este aviso llegue no es evidente, ademas: en el instante del INSERT
     * quien funda todavia no es miembro, y la politica de lectura de `crews`
     * exige serlo. Llega porque `create_crew` escribe el equipo y el puesto en
     * la MISMA transaccion, asi que cuando Realtime evalua la politica el
     * puesto ya existe.
     */
    const watcher = watch(founder.client, 'crews')
    await watcher.ready

    await createActiveCrewAs(founder, 'Equipo en directo')

    expect(await watcher.next()).toBe(true)
    await watcher.close()
  })

  it('borrar tambien avisa, no solo crear y actualizar', async () => {
    const trainer = await signedInAs('tiempo-real-borra', {
      intent: 'trainer',
      first_name: 'Entrenador',
      last_name: 'Prueba',
    })
    const member = await signedInAs('tiempo-real-borrado', {
      intent: 'student',
      first_name: 'Alumno',
      last_name: 'Prueba',
    })
    created.push(trainer, member)

    const crew = await createActiveCrewAs(trainer, 'Equipo con bajas')
    const { data: ficha, error } = await trainer.client
      .from('students')
      .insert({
        crew_id: crew.id,
        profile_id: member.id,
        email: member.email,
        membership_status: 'active',
      })
      .select('id')
      .single()
    if (error !== null) throw new Error(`alta de ficha: ${error.message}`)

    /*
     * REGRESION DE `replica identity full`. Con la identidad por defecto, el
     * registro de un DELETE solo lleva la clave primaria: Realtime no puede
     * evaluar la politica sobre una fila sin columnas, y cualquier filtro por
     * `crew_id` la descartaba. Dar de baja a un alumno no refrescaba a nadie.
     */
    const watcher = watch(trainer.client, 'students')
    await watcher.ready

    await trainer.client.from('students').delete().eq('id', ficha?.id)

    expect(await watcher.next()).toBe(true)
    await watcher.close()
  })

  it('quien no es del equipo no se entera de sus fichas', async () => {
    const trainer = await signedInAs('tiempo-real-ajeno-dueno', {
      intent: 'trainer',
      first_name: 'Duena',
      last_name: 'Prueba',
    })
    const member = await signedInAs('tiempo-real-ajeno-alumno', {
      intent: 'student',
      first_name: 'Alumna',
      last_name: 'Prueba',
    })
    const stranger = await signedInAs('tiempo-real-extrano', {
      intent: 'student',
      first_name: 'Extrano',
      last_name: 'Prueba',
    })
    created.push(trainer, member, stranger)

    const crew = await createActiveCrewAs(trainer, 'Equipo cerrado')

    /*
     * EL CASO NEGATIVO, que es la especificacion de la politica.
     *
     * Se escucha la TABLA ENTERA, sin filtro por equipo, porque asi es como se
     * suscribe la aplicacion: el filtro se quito precisamente porque no sabia
     * expresar «un equipo en el que todavia no estoy». Lo que impide que un
     * extraño reciba estas filas no es el cliente conteniendose, es que el
     * servidor no se las manda.
     */
    const intruder = watch(stranger.client, 'students')
    await intruder.ready

    await trainer.client.from('students').insert({
      crew_id: crew.id,
      profile_id: member.id,
      email: member.email,
      membership_status: 'active',
    })

    expect(await intruder.next(ESPERA_DEL_SILENCIO_MS)).toBe(false)
    await intruder.close()
  })
})
