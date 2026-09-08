import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'

/**
 * El arnes de las pruebas de contrato: clientes contra Supabase local.
 *
 * LAS CLAVES SALEN DE `supabase status`, no de `.env`. El `.env` apunta al
 * proyecto de la nube y estas pruebas no deben tocarlo jamas: crean cuentas,
 * escriben filas y confian en poder empezar de cero con `supabase db reset`.
 * Si hace falta apuntar a otro sitio -la CI-, se pasan por variables de entorno
 * con los mismos nombres que emite la CLI.
 *
 * TRES CLIENTES, tres papeles:
 *  - `anon`: quien todavia no ha entrado. Lo que puede hacer es casi nada, y
 *    que sea casi nada es una de las cosas que se comprueban.
 *  - `admin`: el rol de servicio. Salta RLS. Solo se usa para PREPARAR -crear
 *    cuentas confirmadas, sembrar filas- y para LEER lo que la prueba necesita
 *    verificar por debajo de las politicas. Nunca para ejercitar el adaptador.
 *  - `signedInAs`: una sesion de verdad de una cuenta concreta. Es contra la
 *    que se ejercita cada adaptador, porque es lo que ve la aplicacion.
 */

interface LocalKeys {
  url: string
  anonKey: string
  serviceRoleKey: string
}

let cached: LocalKeys | null = null

function readLocalKeys(): LocalKeys {
  if (cached !== null) return cached

  const fromEnvironment = {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  if (fromEnvironment.url && fromEnvironment.anonKey && fromEnvironment.serviceRoleKey) {
    cached = {
      url: fromEnvironment.url,
      anonKey: fromEnvironment.anonKey,
      serviceRoleKey: fromEnvironment.serviceRoleKey,
    }
    return cached
  }

  const output = execSync('supabase status -o env', { encoding: 'utf-8' })
  const values = new Map<string, string>()
  for (const line of output.split('\n')) {
    const match = /^([A-Z_]+)="?([^"\n]*)"?$/.exec(line.trim())
    if (match !== null) values.set(match[1], match[2])
  }

  const url = values.get('API_URL')
  const anonKey = values.get('ANON_KEY')
  const serviceRoleKey = values.get('SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error('supabase status no devolvio las claves: ¿esta corriendo `supabase start`?')
  }

  cached = { url, anonKey, serviceRoleKey }
  return cached
}

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}

export function anonClient(): SupabaseClient {
  const keys = readLocalKeys()
  return createClient(keys.url, keys.anonKey, clientOptions)
}

export function adminClient(): SupabaseClient {
  const keys = readLocalKeys()
  return createClient(keys.url, keys.serviceRoleKey, clientOptions)
}

/** Un correo que no choca con ninguna prueba anterior ni con la semilla. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@contrato.local`
}

export const TEST_PASSWORD = 'contrato-secreto-123'

export interface TestAccount {
  id: string
  email: string
  client: SupabaseClient
}

/**
 * Una cuenta CONFIRMADA y con sesion abierta.
 *
 * Se crea con el rol de servicio y `email_confirm: true` porque la
 * confirmacion por correo esta activada en local igual que en la nube, y una
 * prueba no puede abrir un buzon. Los metadatos son los mismos que manda la
 * aplicacion en el alta -`toSignUpMetadata`-, asi que el disparador que crea el
 * perfil corre exactamente igual que en produccion.
 */
export async function signedInAs(
  prefix: string,
  metadata: Record<string, string> = {}
): Promise<TestAccount> {
  const email = uniqueEmail(prefix)
  const admin = adminClient()

  const created = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  })
  if (created.error !== null || created.data.user === null) {
    throw new Error(`no se pudo crear la cuenta de prueba: ${created.error?.message}`)
  }

  const client = anonClient()
  const signedIn = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD })
  if (signedIn.error !== null) {
    throw new Error(`no se pudo entrar con la cuenta de prueba: ${signedIn.error.message}`)
  }

  return { id: created.data.user.id, email, client }
}

/** Borra las cuentas creadas por una prueba. Sus perfiles caen en cascada. */
export async function deleteAccounts(accounts: TestAccount[]): Promise<void> {
  const admin = adminClient()
  for (const account of accounts) {
    await admin.auth.admin.deleteUser(account.id)
  }
}
