import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

/**
 * Las tres opciones de tema.
 *
 * `system` NO es un tema: es la renuncia a elegir uno. Quien lo escoge delega
 * en el sistema operativo, y la aplicación cambia sola cuando el teléfono pasa
 * a modo noche. Por eso son tres opciones y no un interruptor de dos.
 */
export const APP_THEMES = ['light', 'dark', 'system'] as const

export type AppTheme = (typeof APP_THEMES)[number]

function isAppTheme(value: string | undefined): value is AppTheme {
  return value !== undefined && (APP_THEMES as readonly string[]).includes(value)
}

interface UseThemePreferenceResult {
  /**
   * Lo ELEGIDO, que puede ser `system`. Es lo que marca el selector.
   *
   * `null` hasta que se sabe: la preferencia vive en el almacenamiento del
   * navegador y no está disponible en el primer render. Sin este estado
   * intermedio, el selector marcaba «claro» durante un instante aunque estuviera
   * guardado «oscuro», y el salto se veía.
   */
  theme: AppTheme | null
  /** Lo que se está viendo de verdad. `system` ya resuelto a claro u oscuro. */
  resolvedTheme: 'light' | 'dark' | null
  setTheme: (theme: AppTheme) => void
}

/**
 * La preferencia de tema, tipada.
 *
 * Envuelve a `next-themes`, que devuelve `string | undefined` para el tema: sin
 * esta capa, cada consumidor tendría que comparar contra cadenas sueltas y nada
 * impediría escribir `setTheme('oscuro')` y quedarse sin efecto ni aviso.
 *
 * Es también el único punto que nombra la librería fuera del proveedor, así que
 * cambiarla es cambiar este fichero.
 */
export function useThemePreference(): UseThemePreferenceResult {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return {
    theme: mounted && isAppTheme(theme) ? theme : null,
    resolvedTheme: mounted && (resolvedTheme === 'light' || resolvedTheme === 'dark')
      ? resolvedTheme
      : null,
    setTheme,
  }
}
