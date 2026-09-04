import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase (ver .env.example)')
}

/**
 * Cliente de Supabase.
 *
 * Solo debe importarse desde este directorio. La regla no-restricted-imports de
 * eslint.config.js lo impide en el resto del proyecto: es lo que mantiene el
 * desacoplamiento como algo estructural y no como una buena intencion.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
