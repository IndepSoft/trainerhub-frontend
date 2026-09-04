/** Lo que se puede meter en un hueco de una cadena. */
export type TranslationValues = Record<string, string | number>

const PLACEHOLDER = /\{(\w+)\}/g

/**
 * Rellena los huecos de una cadena traducida.
 *
 * `{nombre}` y no `%s` ni `{0}`: el traductor necesita saber QUÉ va en el hueco
 * para colocarlo donde le toque en su idioma. Un orden fijo obliga a que todas
 * las lenguas ordenen igual, y no lo hacen.
 *
 * Un hueco sin valor se deja tal cual en vez de quedar vacío. Ver «{count}» en
 * pantalla es feo pero dice exactamente qué falta; un hueco en blanco esconde
 * el fallo hasta que alguien lo lee con calma.
 */
export function fillPlaceholders(text: string, values?: TranslationValues): string {
  if (values === undefined) return text

  return text.replace(PLACEHOLDER, (whole, name: string) => {
    const value = values[name]
    return value === undefined ? whole : String(value)
  })
}
