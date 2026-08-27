/// <reference types="vite/client" />

/**
 * Variables de entorno del proyecto, declaradas para que `import.meta.env` esté
 * tipado y un nombre mal escrito falle en compilación en vez de quedar como
 * `undefined` en tiempo de ejecución.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Activa FakeAuthAdapter. Sólo se tiene en cuenta en desarrollo. */
  readonly VITE_USE_FAKE_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
