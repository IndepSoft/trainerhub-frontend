import { useEffect, useState } from 'react'

/**
 * El punto donde una pantalla deja de componerse en una columna.
 *
 * 1152 y no el `lg` de Tailwind, y está medido: con la barra lateral de 256 px
 * y los márgenes, a 1024 quedan 770 px de contenido, y partirlos en 380 + 390
 * dejaba la ruta de la ficha con «Puntos en la ruta · 326/300» en tres líneas.
 * A 1152 quedan 824 y las dos columnas respiran. Entre 1024 y 1151 —una tableta
 * apaisada— se ve la composición de una columna, con más aire.
 */
const WIDE_VIEWPORT_QUERY = '(min-width: 1152px)'

function matchesWideViewport(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(WIDE_VIEWPORT_QUERY).matches
}

/**
 * Si la ventana es ancha, decidido en JAVASCRIPT y no en CSS.
 *
 * LA EXCEPCIÓN, Y SU MOTIVO. En este sistema la regla es que decida el CSS: se
 * pintan las dos formas y `md:hidden` elige, que es lo que hacen la fecha de la
 * agenda o las etiquetas de las acciones. Aquí no sirve. Las pantallas que se
 * componen en columnas —la ficha del alumno, el equipo, el progreso— montarían
 * SUS SECCIONES DOS VECES, y cada sección trae sus hooks: dos veces el progreso
 * del alumno, dos veces el ranking del equipo, dos consultas por pantalla
 * ancha. En los formularios es peor todavía: dos juegos de campos con los
 * mismos `id`, que es HTML inválido y rompe el `<label for>`.
 *
 * Así que aquí el componente elige qué montar, y monta uno solo.
 *
 * El valor inicial se lee SÍNCRONO de `matchMedia`, no en un efecto: esta
 * aplicación se pinta en el cliente, así que el primer render ya sabe el ancho
 * y no hay parpadeo de una composición a la otra.
 *
 * No es `useIsMobile`: aquel vive en 768 y es de la barra lateral de shadcn.
 * La composición de escritorio empieza donde caben dos columnas de verdad.
 */
export function useWideViewport(): boolean {
  const [isWide, setIsWide] = useState(matchesWideViewport)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia(WIDE_VIEWPORT_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setIsWide(event.matches)

    mediaQuery.addEventListener('change', handleChange)
    setIsWide(mediaQuery.matches)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isWide
}
