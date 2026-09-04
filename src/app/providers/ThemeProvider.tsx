import { useEffect } from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'

/**
 * Dónde se guarda el tema elegido.
 *
 * Se exporta porque hay un SEGUNDO lector fuera de React: el guion en línea de
 * `index.html` que aplica la clase antes del primer pintado. Los dos tienen que
 * usar exactamente esta clave, así que vive en un solo sitio aunque uno de los
 * dos no pueda importarla.
 */
export const THEME_STORAGE_KEY = 'trainerhub.tema'

/**
 * El color de la barra del navegador, uno por tema.
 *
 * No es decoración: en una PWA instalada esta etiqueta tiñe la barra de estado
 * del sistema. Con un solo valor fijo, el tema oscuro dejaba una franja azul
 * brillante pegada a una aplicación negra.
 *
 * El oscuro es `--bone` del bloque `.dark` convertido a hexadecimal —la
 * etiqueta no entiende `hsl(var(…))`—, así que si cambia la paleta hay que
 * cambiarlo aquí también.
 */
const BROWSER_BAR_COLOR = {
  light: '#0b4bcc',
  dark: '#0d1017',
} as const

/**
 * Mantiene la barra del navegador del color del tema activo.
 *
 * Se lee `resolvedTheme` y no `theme`: con «sistema» elegido, `theme` vale
 * literalmente `'system'`, que no es un color.
 */
function BrowserBarColor(): null {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta === null) return

    const color = resolvedTheme === 'dark' ? BROWSER_BAR_COLOR.dark : BROWSER_BAR_COLOR.light
    meta.setAttribute('content', color)
  }, [resolvedTheme])

  return null
}

interface ThemeProviderProps {
  children: React.ReactNode
}

/**
 * El tema: claro, oscuro o el del sistema.
 *
 * `attribute="class"` porque Tailwind está configurado con `darkMode: ['class']`:
 * la librería pone o quita `dark` en `<html>` y el bloque `.dark` del CSS hace
 * el resto. Ningún componente pregunta por el tema para elegir un color; los
 * tokens ya cambian de valor solos.
 *
 * `disableTransitionOnChange` apaga las transiciones durante el cambio. Sin eso,
 * las decenas de `transition-colors` de la aplicación animan A LA VEZ y el
 * cambio se ve como un barrido sucio de medio segundo en vez de un corte limpio.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
    >
      <BrowserBarColor />
      {children}
    </NextThemesProvider>
  )
}
