/**
 * Los idiomas que habla la aplicación.
 *
 * Tres, y ninguno es una traducción parcial: o está entero o no está. Media
 * pantalla en inglés y media en español se lee como un fallo, no como una
 * traducción a medias.
 */
export const LANGUAGES = ['es', 'en', 'pt'] as const

export type Language = (typeof LANGUAGES)[number]

/** El de fábrica. Es el idioma en el que se escribió la aplicación. */
export const DEFAULT_LANGUAGE: Language = 'es'

/**
 * El nombre de cada idioma EN SU PROPIO IDIOMA.
 *
 * Nunca traducido: quien busca «Português» en un menú que está en español no
 * encuentra «Portugués». Es la convención de todo selector de idioma serio, y
 * la razón por la que estas tres cadenas no viven en los diccionarios.
 */
export const LANGUAGE_NAMES: Record<Language, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
}

/**
 * La etiqueta BCP 47 de cada idioma.
 *
 * La usan dos cosas distintas: `Intl` para dar formato a fechas y números, y el
 * atributo `lang` de `<html>`, del que dependen los lectores de pantalla para
 * elegir la voz y el navegador para partir las palabras.
 *
 * Se eligen variantes concretas y no el código suelto porque los formatos
 * difieren: `pt-BR` escribe «2 de set.» y `pt-PT` «2 de set.» con otras
 * abreviaturas, y `en-US` pone el mes delante del día.
 */
export const LANGUAGE_TAGS: Record<Language, string> = {
  es: 'es-ES',
  en: 'en-US',
  pt: 'pt-BR',
}

export function isLanguage(value: string | null): value is Language {
  return value !== null && (LANGUAGES as readonly string[]).includes(value)
}

/**
 * El idioma que mejor encaja con lo que pide el navegador.
 *
 * Compara sólo la parte primaria: quien tiene el navegador en `pt-PT` recibe
 * portugués, aunque la aplicación formatee en `pt-BR`. Devolver español a un
 * portugués porque la variante no coincide sería peor que la diferencia entre
 * variantes.
 */
export function detectLanguage(preferred: readonly string[]): Language {
  for (const candidate of preferred) {
    const primary = candidate.split('-')[0].toLowerCase()
    if (isLanguage(primary)) return primary
  }
  return DEFAULT_LANGUAGE
}
