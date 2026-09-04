import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * ¿El usuario ha pedido menos movimiento?
 *
 * Se consulta el sistema, no una preferencia propia de la aplicación. Es un
 * ajuste de accesibilidad real: para quien tiene trastornos vestibulares, una
 * animación de barra o un confeti no es un adorno, es un mareo.
 *
 * El valor inicial se lee de forma sincrona en vez de arrancar en `false` y
 * corregir en el efecto: empezar suponiendo que sí hay movimiento provocaría un
 * primer fotograma animado justo para quien pidió que no lo hubiera.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia(QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}
