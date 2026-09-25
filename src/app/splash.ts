/** Lo que tarda la transición de salida en `index.html`. */
const FADE_MILLISECONDS = 240

let alreadyHidden = false

function removeSplash(): void {
  const splash = document.getElementById('splash')
  if (splash === null) return

  splash.dataset.saliendo = 'true'
  window.setTimeout(() => splash.remove(), FADE_MILLISECONDS)
}

/**
 * Retira la pantalla de arranque.
 *
 * Se llama cuando la aplicación ya sabe qué enseñar —la sesión resuelta—, no
 * cuando React monta: montar ocurre antes de que haya nada que mirar, y
 * retirarla ahí devolvía el esqueleto que esto viene a evitar.
 *
 * El plazo máximo por si esto nunca se llama NO está aquí sino en
 * `index.html`: si el paquete no llega a ejecutarse, este módulo tampoco, y
 * una capa que intercepta los toques no puede depender de que arranque.
 */
export function hideSplash(): void {
  if (alreadyHidden) return
  alreadyHidden = true

  /*
   * Un fotograma de margen: se pide DESPUÉS de que el navegador haya pintado
   * lo que hay debajo. Sin esto, entre quitar la pantalla y pintar la
   * aplicación quedaba un destello del fondo desnudo.
   */
  window.requestAnimationFrame(() => window.requestAnimationFrame(removeSplash))
}
