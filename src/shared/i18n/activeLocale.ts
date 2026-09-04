import { DEFAULT_LANGUAGE, LANGUAGE_TAGS, type Language } from './languages'

/*
 * La etiqueta de idioma activa, fuera de React.
 *
 * ES ESTADO DE MÓDULO, y eso pide una explicación. Las funciones que dan
 * formato a fechas —`describeWeekRange`, `formatDateKey`, `describePostTime`—
 * son utilidades puras que se llaman desde reductores, desde `map` y desde
 * sitios donde no hay componente, así que no pueden usar un hook. Las dos
 * alternativas eran:
 *
 *  1. Pasar el idioma como parámetro a cada una de ellas, y desde ahí a cada
 *     una de sus veinte llamadas. Es lo correcto en abstracto y convierte un
 *     dato ambiental en ruido en cada firma.
 *  2. Esto: un valor de módulo con UN SOLO ESCRITOR —`LanguageProvider`— y
 *     muchos lectores.
 *
 * Se eligió lo segundo. La condición que lo hace seguro es que nadie más
 * llame a `setActiveLanguage`, y por eso vive aquí y no en el fichero de
 * idiomas: quien importe `languages.ts` no encuentra el escritor de paso.
 */
let activeLanguage: Language = DEFAULT_LANGUAGE

/** Sólo lo llama `LanguageProvider`. */
export function setActiveLanguage(language: Language): void {
  activeLanguage = language
}

/**
 * La etiqueta BCP 47 para `Intl` y `toLocaleDateString`.
 *
 * Sustituye a los diecisiete `'es-ES'` escritos a mano que había repartidos por
 * el calendario, el muro y las fichas.
 */
export function activeLocale(): string {
  return LANGUAGE_TAGS[activeLanguage]
}
