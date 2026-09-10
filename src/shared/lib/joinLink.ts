/**
 * El enlace y el código que se enseñan para entrar a un crew.
 *
 * EL QR CODIFICA UNA URL, NO EL TOKEN SUELTO. Es la decisión que más simplifica
 * todo esto: con una URL, la cámara nativa del móvil ya sirve —apuntas y se abre
 * la aplicación en la pantalla correcta— y no hace falta escribir un lector de
 * QR dentro de la app. Un lector propio significaría pedir permiso de cámara,
 * mantener un decodificador y fallar en los navegadores que no lo permiten, todo
 * para llegar al mismo sitio.
 */

/** El parámetro que lleva el código en la URL de entrada. */
export const JOIN_CODE_PARAM = 'codigo'

export function buildJoinUrl(joinToken: string): string {
  return `${window.location.origin}/crew/unirse?${JOIN_CODE_PARAM}=${joinToken}`
}

/**
 * El código partido en dos mitades, para leerlo y teclearlo.
 *
 * `HIERRO24` → `HIER-RO24`. Ocho caracteres seguidos se copian mal de una
 * pantalla ajena; en dos grupos de cuatro, no. El guión es sólo presentación:
 * `findByJoinToken` lo quita antes de comparar, así que da igual si alguien lo
 * escribe y da igual si no.
 */
export function formatJoinCode(joinToken: string): string {
  const middle = Math.ceil(joinToken.length / 2)
  return `${joinToken.slice(0, middle)}-${joinToken.slice(middle)}`
}
